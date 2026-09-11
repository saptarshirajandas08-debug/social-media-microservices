//here the identity service will do authentication related things, this will help user to register a new user, login a new user, for logout and we are going to create a refreash token
require('dotenv').config();
const express = require('express');
const {dbConnection} = require('./config/db');
const{logger} = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const {rateLimit } = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const {router} = require('./routes/identity-service');
const {errorHandler} = require('./middleware/errorHandler');
const app = express();

dbConnection();

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
//helmet is a package that secures the express app, it will set various HTTP headers which will input our security also that middleware we will going to use add headers
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use((req, res, next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})
//DDOS protection and rate limiting
// rate-limiter-flexible counts and limits the number of events and protects from DoS and brute force attacks at any scale.
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
app.use('api/auth/register', sensitiveEndpointsLimiter);

//main route
app.use('/api/auth', router);

//error handler
app.use(errorHandler);

const port = process.env.PORT || 8000;
app.listen(port, ()=>{
    console.log(`Server started at ${port}`);
    logger.info(`Identity service started at ${port}`);
})

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});