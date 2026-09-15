const express = require('express');
const {registrationUser, loginUser, refreashTokenUser, logoutUser} = require('../controller/identity-controller');

const router = express.Router();

router.post('/registration', registrationUser);
router.post('/login', loginUser);
router.post('/refreash-token', refreashTokenUser);
router.post('/logout', logoutUser);

module.exports = {router};