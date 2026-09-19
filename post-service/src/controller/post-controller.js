const {logger} = require('../utils/logger');
const {validateCreatedPost} = require('../utils/validation');
const {posts} = require('../models/posts');

const createPost = async(req, res)=> {
    try{
        logger.info("create post endpoint hit");
        const {content, mediaIds} = req.body;
        const newlyCreatedPost = new posts({
             user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        })
        await newlyCreatedPost.save();
        logger.info("Post created successfully", newlyCreatedPost);
        return res.status(201).json({
            success: true,
            message: "Post created successfully",
        })
    }catch(error){
        logger.error("Error creating post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

const getAllpost = async(req, res)=> {
    try{
        logger.info("get all post endpoint hit")
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        //set cache key for store the data into cache
        const cacheKey = `posts:${page}:${limit}`;
        //now after creating the key we are going to get this from the cache
        const cachedPosts = await req.redisClient.get(cacheKey);
        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts));
        }
        const allData = await posts.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit);
        const totalNoOfPosts = await posts.countDocuments();
        const result = {
            allData, 
            currectpage: page,
            totalPages: Math.ceil(totalNoOfPosts/limit),
            totalPosts: totalNoOfPosts,
        }

        //save your posts in redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
        res.json(result);

    }catch(error){
        logger.error("Error get all post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

const getPost = async(req, res)=> {
    try{
        logger.info("get post endpoint hit")
    }catch(error){
        logger.error("Error get post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

const deletePost = async(req, res)=> {
    try{
        logger.info("delete post endpoint hit")
    }catch(error){
        logger.error("Error delete post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

module.exports = {createPost, getAllpost, getPost, deletePost}