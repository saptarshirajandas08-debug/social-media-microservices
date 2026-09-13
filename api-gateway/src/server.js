//here the api-gateway is running on 3000, Identity service is running on 8000 and media service running on 4000.
//But here we are going to manage everything from this api-gateway.
//So whenever the api gateway will be targeted identity-service, it will create a proxy and it will divert that port from 3000 to 8000. When we will target media services, it will target instead 3000, it will create a proxy to 3000.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const {logger} = require('./utils/logger');
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const proxy = require('express-http-proxy');
const {errorHandler} = require('./middleware/errorHandler');
const app = express();

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//rate limiting
const ratelimitOptions = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        return res.status(429).json({
            success: false,
            message: "Too many requests."
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});
app.use(ratelimitOptions);

app.use((req, res, next)=> {
    logger.info(`Recieved ${req.method} request to ${redisClient.url}`);
    logger.info(`Request body ${req.body}`);
    next();
})

// identity -> /api/auth/registration -> this is runing on 8000. But this api gatewa is running on 3000. Now suppose in api-gateway i set /v1/auth/registration if i use 8000 localhost then we will be use the 3000 localhost.
//3000/v1/api/auth/registration
const proxyOptions = {
    proxyReqPathResolver : (req) => { // this will replace your version one prefix that we are having with the original /api. It is replace the /api with /v1.
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Error message ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
}

//setting up proxy for our identity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SRVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) =>{
        proxyReqOpts.headers["Content-Type"] = 'application/json'; 
        return proxyReqOpts;
    },
    //userResDecorator function will be called whenever we will reciving a response from the proxy server.
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=> {
        logger.info(`Resoponse received from post service ${proxyRes.statusCode}`);
        return proxyResData;
    }
}))

app.use(errorHandler);

const port = process.env.PORT;
app.listen(port, ()=>{
    logger.info(`Api gateway is running on port ${port}`);
    logger.info(`Identity service is running on ${process.env.IDENTITY_SRVICE_URL}`);
    logger.info(`Redis url : ${process.env.REDIS_URL}`);
})