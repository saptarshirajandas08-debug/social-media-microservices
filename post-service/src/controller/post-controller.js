const {logger} = require('../utils/logger');
const {validateCreatedPost} = require('../utils/validation');
const {posts} = require('../models/posts');

//when we will create a new post we have to invalidate the cache or else if we alwas get from the cache, suppose we added 100 posts we will be getting five post all the time, because we will getting all of these from our cache only, so that means we need to invalidate the cache
async function invalidatePostCache(req, input){
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);
    const keys = await req.redisClient.keys("posts:*");
    if(keys.length>0){
        await req.redisClient.del(keys);
    }
}

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
        await invalidatePostCache(req, newlyCreatedPost._id.toString());
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
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if(cachedPost){
            return res.json(JSON.parse(cachedPost));
        }
        const postDetailsById = await posts.findById(postId);
        if(!postDetailsById){
            logger.info("Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found",
            })
        }
        await req.redisClient.setex(
            cachedPost,
            3600,
            JSON.stringify(postDetailsById)
        )
        res.json(postDetailsById);
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
        const deletePost = await posts.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.userId,
        })
        if(!deletePost){
            logger.info("Post not found");
            return res.status(404).json({
                success: false,
                message: "Post not found",
            })
        }
         await invalidatePostCache(req, req.params.id);
         res.json({
           message: "Post deleted successfully",
         });
    }catch(error){
        logger.error("Error delete post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

module.exports = {createPost, getAllpost, getPost, deletePost}