const mongoose = require('mongoose');
const {logger} = require('../utils/logger');

async function dbConnection() {
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        logger.info("Database connected");
    }catch(error){
        logger.error("Database connection error: ",error)
    }
}

module.exports = {dbConnection};