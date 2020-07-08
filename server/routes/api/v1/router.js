const express = require('express');
const router = express.Router();

const { authRouter } = require('./auth/auth');
router.use('/auth', authRouter);

const { userRouter } = require('./user/user');
router.use('/user', userRouter);

const { supplierRouter } = require('./supplier/supplier');
router.use('/supplier', supplierRouter);

const { partRouter } = require('./part/part');
router.use('/part', partRouter);

module.exports = {
    apiV1Router: router
}