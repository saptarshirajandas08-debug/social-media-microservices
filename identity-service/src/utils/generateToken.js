const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {refreashToken} = require('../models/RefreashToken');
const generateToken = async(user)=>{
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, {expiresIn: '60m'})
    const RefreashToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); //refreash token expires in 7 days.

    await refreashToken.create({
        token: RefreashToken,
        user: user._id,
        expiresAt,
    });
    return {accessToken, RefreashToken};
}

module.exports = {generateToken};