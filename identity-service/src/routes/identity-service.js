const express = require('express');
const {registrationUser, loginUser} = require('../controller/identity-controller');

const router = express.Router();

router.post('/registration', registrationUser);
router.post('/login', loginUser);

module.exports = {router};