const {logger} = require('../utils/logger');
const {user} = require('../models/User');
const {refreashToken} = require('../models/RefreashToken');
const {generateToken} = require('../utils/generateToken');
const {validateRegistration} = require('../utils/validation')
//user registration
const registrationUser = async(req, res)=>{
    logger.info('Registration endpoint hit...')
    try{
        const{error} = validateRegistration(req.body);
        if(error){
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error,
            })
        }
        const {username, email, password} = req.body;
        let existinguser = await user.findOne({$or: [{email}, {username}]}); // for check existing user it should be always let not const
        if(existinguser){
            logger.warn('User already existed');
            return res.status(400).json({
                success: false,
                message: "User already exist."
            })
        }
        existinguser = new user({username, email, password});
        await existinguser.save();

        logger.warn("User saved successfully", existinguser._id);
        const {accessToken, RefreashToken} = await generateToken(existinguser);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            RefreashToken
        })
    }catch(error){
        logger.error("Registration error occured", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

module.exports = {registrationUser}