//here the identity service will do authentication related things, this will help user to register a new user, login a new user, for logout and we are going to create a refreash token

require('dotenv').config();
const express = require('express');
const {dbConnection} = require('./config/db');
const{logger} = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

dbConnection();

//middleware
//helmet is a package that secures the express app, it will set various HTTP headers which will input our security also that middleware we will going to use add headers
app.use(helmet());
spp.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use((req, res, next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

// rate-limiter-flexible counts and limits the number of events and protects from DoS and brute force attacks at any scale.

const port = process.env.PORT || 8000;
app.listen(port, ()=>{
    console.log(`Server started at ${port}`);
})