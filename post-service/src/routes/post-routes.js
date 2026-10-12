const express = require('express');
const {createPost, getAllpost, getPost, deletePost} = require('../controller/post-controller');
const {authenticateRequest} = require('../middleware/authMiddleware');

const router = express.Router();

//middleware -> this will tell this user is authenticate or not
router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/getAll-post', getAllpost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);

module.exports = {router};