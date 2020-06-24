const express = require('express');
const router = express.Router();

const { authRouter } = require('./auth/auth');
router.use('/auth', authRouter);

const { userRouter } = require('./user/user');
router.use('/user', userRouter);

module.exports = {
    apiV1Router: router
}