const mongoose = require('mongoose');

const refreashTokenSchema = new mongoose.Schema({
    token:{
        type: String,
        required: true,
        unique: true,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    expiresAt:{
        type: Date,
        required: true,
    }
}, {timestamps: true})

refreashTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const refreashToken = mongoose.model('refreashtoken', refreashTokenSchema);

module.exports = {refreashToken};