const mongoose = require('mongoose');
const {logger} = require('../utils/logger');

const dbConnection = async() =>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        logger.info("MongoDB Database connect");
    }catch(error){
        logger.error("Database connection error", error);
    }
}

module.exports = {dbConnection};