const mongoose = require('mongoose');
const {logger} = require('../utils/logger');
const dbConnection = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        // console.log('Database connected');
        logger.info('Database connected')
    }catch(error){
        console.log(error);
    }
}

module.exports = {dbConnection};