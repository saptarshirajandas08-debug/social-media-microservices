const {logger} = require('../utils/logger');
const {user} = require('../models/User');
const {refreashToken} = require('../models/RefreashToken');
const {generateToken} = require('../utils/generateToken');
const {validateRegistration, validateLogin} = require('../utils/validation');
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

        logger.info("User saved successfully", existinguser._id);
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

//user login
const loginUser = async(req, res)=> {
    logger.info("Login endpoint hit");
    try{
        const {error} = validateLogin(req.body);
        if(error){
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            })
        }
        const {email, password} = req.body;
        const existingUser = await user.findOne({email});
        if(!existingUser){
            logger.warn('Invalid user');
            return res.status(400).json({
                success: false,
                message: "Invalid credential",
            })
        }

        //valid password or not
        const isValidPassword = await existingUser.comparePassword(password);
        if(!isValidPassword){
            logger.warn('Invalid password');
            return res.status(400).json({
                success: false,
                message: "Invalid credential",
            })
        }
        const {accessToken, RefreashToken} = await generateToken(existingUser);
        res.json({
            accessToken, 
            RefreashToken,
            userId: existingUser._id,
        })
    }catch(error){
        logger.error(`Login error occured ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

//refreash token
const refreashTokenUser = async(req, res)=> {
    logger.info("Refreashtoken endpoint hit....");
    try{
        const {refreashTokens} = req.body;
        if(!refreashTokens){
            logger.warn("Refreash token missing");
            return res.status(400).json({
                success: false,
                message: "Rfreshtoken is missing",
            })
        }
        const storedToken = await refreashToken.findOne({refreashTokens});
        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Invaild or expired refreash token");
            return res.statsu(400).json({
                success: false,
                message: "Invalid or refreash token",
            })
        }
        const existingUser = await user.findById(storedToken.user);
        if(!existingUser){
            logger.warn("User not found");
            return res.status(400).json({
                success: false,
                message :"User not found",
            })
        }

        const {accessToken: newAccessToken, RefreashToken: newRefreashToken} = await generateToken(existingUser);
        //delete the old refreash token
        await refreashToken.deleteOne({_id: storedToken._id});

        res.json({
            accessToken: newAccessToken, 
            RefreashToken: newRefreashToken,
        })
    }catch(error){
        logger.error(`The error is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

//logout controller
const logoutUser = async(req, res)=> {
    try{
        logger.info("Logger endpoint hit...");
        const {refreashTokens} = req.body;
        if(!refreashTokens){
            logger.warn("Refreash token is missing");
            return res.status(400).json({
                success: false,
                message: "Refreash token is missing",
            })
        }
        await refreashToken.deleteOne({refreashTokens});
        logger.info("Refreash token deleted for logout.")
        res.json({
            success: true,
            message: "Logged out successfully"
        })
    }catch(error){
        logger.error("Logout error", error);
        return res.status(500).json({
            success: false,
            message:"Internal server error",
        })
    }
}

module.exports = {registrationUser, loginUser, refreashTokenUser, logoutUser};