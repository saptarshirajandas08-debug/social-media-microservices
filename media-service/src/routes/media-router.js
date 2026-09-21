const express = require('express');
const {logger} = require('../utils/logger');
const {authenticateRequest} = require('../middleware/authMiddleware');
const multer = require('multer');
const {uploadMedia} = require('../controller/media-controller');

const router = express.Router();

//configuration of multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
}).single('file');

router.post('/file-upload', authenticateRequest, (req, res, next)=> {
    upload(req, res, function(error){
        if(error instanceof multer.MulterError){
            logger.error("Error while uploading", error);
            return res.status(400).json({
                success: false,
                message: error.message,
                stack: error.stack,
            })
        }else if(error){
            logger.error("Unknown error occured while uploading:", error);
                return res.status(500).json({
                  message: "Unknown error occured while uploading:",
                  error: error.message,
                  stack: error.stack,
                });
        }
         if (!req.file) {
          return res.status(400).json({
            message: "No file found!",
          });
        }

        next();
    })
}, uploadMedia);

module.exports = {router};