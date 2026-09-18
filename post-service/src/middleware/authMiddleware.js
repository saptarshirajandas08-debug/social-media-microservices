const {logger} = require('../utils/logger');

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id']; // here we will get the user id from the header
    if(!userId){
        logger.warn("Access attempted without user id");
        return res.status(401).json({
            success: false,
            message: "Authentication required, please login to continue",
        })
    }
    req.user = {userId};
    next();
}

module.exports = {authenticateRequest};