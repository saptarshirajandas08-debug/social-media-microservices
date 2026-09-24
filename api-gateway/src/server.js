//here the api-gateway is running on 3000, Identity service is running on 8000 and media service running on 4000.
//But here we are going to manage everything from this api-gateway.
//So whenever the api gateway will be targeted identity-service, it will create a proxy and it will divert that port from 3000 to 8000. When we will target media services, it will target instead 3000, it will create a proxy to 3000.


//advantages:
// while we are creating these services post service, search service, identity service and media service seperate, the first adventage is scalibilty, when we creating each service that can be scale independently based on the specific load. Second is technology flexibility whenever we creating seperate service that mean each service can use most appropriate technology stack.

//workflow:
// suppose a user will create a post, so that means the client will send a create post api and submit it to the gateway, then the api gateway forwards this request to post service, and then post service create a post in the mongosb database. Now the post service will publish the particular event in the rabbitmq.

//Now if i delete post from the post service then the media id will be deleted but we have to delete the same media from the media table also. So that means we have to delete this two places but we are using different services, we need a connection to communicate between two services now here the RabbitMQ comes.

//RabbitMQ is a RabbitMQ message broker used to send, store, and route messages so different software applications can communicate with each other asynchronously. It will help us to communicate between different components. So for this we impliment AMQP (Advanced Message Queuing Protocol), which is standard for message oriented protocol. Some of the key featues are asynchronous messaging, decoupling
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
const {validateToken} = require('./middleware/authMiddleware');
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

//setting up proxy for identity service
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

//setting up proxy for post service
//now when we setting our proxy for the post service.
app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq)=> {
        proxyReqOpts.headers['content-Type'] = 'application/json';
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
}))

//setting up proxy for media service
app.use('/v1/media', validateToken, proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq)=> {
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
            proxyReqOpts.headers['content-Type'] = 'application/json';
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
     parseReqBody: false,
}))

app.use(errorHandler);

const port = process.env.PORT;
app.listen(port, ()=>{
    logger.info(`Api gateway is running on port ${port}`);
    logger.info(`Identity service is running on ${process.env.IDENTITY_SRVICE_URL}`);
    logger.info(`Post service is running on port ${process.env.POST_SERVICE_URL}`);
    logger.info(`Media service is running on port ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`Redis url : ${process.env.REDIS_URL}`);
})