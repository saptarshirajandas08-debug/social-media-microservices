const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    content:{
        type: String,
        required: true,
    },
    mediaIds: [
        {
            type: String,
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    }
},{timeStamps: true})

postSchema.index({content: "text"});

const posts = mongoose.model('post', postSchema);

module.exports = {posts};