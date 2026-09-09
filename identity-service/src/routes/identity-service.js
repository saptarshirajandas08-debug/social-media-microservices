const express = require('express');
const {registrationUser} = require('../controller/identity-controller');

const router = express.Router();

router.post('/registration', registrationUser);

module.exports = {router};