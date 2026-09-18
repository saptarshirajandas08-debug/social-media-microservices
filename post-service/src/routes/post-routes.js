const express = require('express');
const {createPost} = require('../controller/post-controller');
const {authenticateRequest} = require('../middleware/authMiddleware');

const router = express.Router();

//middleware -> this will tell this user is authenticate or not
router.use(authenticateRequest);

router.post('/create-post', createPost);

module.exports = {router};