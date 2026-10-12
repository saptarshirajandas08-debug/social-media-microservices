require('dotenv').config();
const express = require('express');
const {dbConnection} = require('./config/db');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const {errorHandler} = require('./middleware/errorHandler'); 
const {rateLimit } = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const {logger} = require('./utils/logger');
const {connectRabbitmq, consumeEvent} = require('./utils/rabbitmq');
const {router} = require('./routes/search-routes');
const {handlePostCreated, handlePostDeleted} = require("./eventHandlers/event-handlers");

const app = express();
const PORT = process.env.PORT || 6000;

dbConnection();
const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient, // this store client is the redis client instance
    keyPrefix: "middleware",//A keyPrefix in a rate limiter is a string value added to the beginning of storage keys (like in Redis, Memcached, or memory) to namespace and uniquely identify different rate-limiting rules or endpoints.
    points: 10,//point is the maximum number of request that can user or ip adderess can make in a given period time
    duration: 1, //here that means we can make 10 requests in 1 seond.
})

//now it will autometically check and block the ip if anyone trying to do more requesting that given period of time.
app.use((req, res, next)=> {
    rateLimiter.consume(req.ip)
    .then(()=>next())
    .catch(()=> {
        logger.warn(`Rate limit exceeded for ip ${req.ip}`);
        return res.status(429).json({
            success: false,
            message: "Too many requests"
        })
    })
})

//Ip based rate limiting for sensitive endpoints.
// Use to limit repeated requests to public APIs and/or endpoints such as password reset.
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res)=> {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP ${req.ip}`);
        return res.status(429).json({
            success: false,
            message: "Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
})

//apply this sensitiveEndpointLimiters to the routes
app.use('api/auth/search', sensitiveEndpointsLimiter);

app.use("/api/search", router);

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitmq();

    //consume the events / subscribe to the events
    await consumeEvent("post.created", handlePostCreated);

    await consumeEvent('post.deleted', handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`);
    });
  } catch (e) {
    logger.error(e, "Failed to start search service");
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});