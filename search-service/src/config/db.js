const mongoose = require('mongoose');
const {logger} = require('../utils/logger');

const dbConnection = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        logger.info("Database connected")
    }catch(error){
        logger.error("Error to connect in database", error);
    }
}

module.exports = {dbConnection};