const {logger} = require('../utils/logger');
const {uploadMediaToCloudinary, deleteMediaFromCloudinary} = require('../utils/cloudinary');
const {media} = require('../models/media');

const uploadMedia = async(req, res)=> {
    try{
        logger.info("Upload media endpoint hit...");
        if(!req.file){
            logger.warn("No file found please adding a file");
            return res.status(400).json({
                success: false,
                message: "No file found please adding a file"
            })
        }
        const {originalname, mimetype, buffer} = req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalname}, type=${mimetype}`);
        logger.info("Uploading to cloudinary starting...");

       const startTime = Date.now();
       const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
       logger.info(`Cloudinary upload took ${Date.now() - startTime}ms`);

            const newlyCreatedMedia = new media({
              publicId: cloudinaryUploadResult.public_id,
              originalName: originalname,
              mimeType: mimetype,
              url : cloudinaryUploadResult.secure_url,
              userId,
            })
            await newlyCreatedMedia.save();
            return res.status(201).json({
                success: true,
                mediaId: newlyCreatedMedia._id,
                url: newlyCreatedMedia.url,
                message: "File uploaded successfully",
            })
    }catch(error){
        logger.error("error while upload media", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

const getAllMedia = async(req, res)=> {
    try{
        logger.info("get all media endpoint hit....");
        const result = await media.find({userId: req.user.userId});
        if(result.length === 0){
            return res.status(404).json({
                success:false,
                message:"Cann't find any media for this user"
            })
        }
        res.json({result});
    }catch(error){
        logger.error("error while upload media", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

module.exports = {uploadMedia, getAllMedia};