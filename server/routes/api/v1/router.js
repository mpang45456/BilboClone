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

const { customerRouter } = require('./customer/customer');
router.use('/customer', customerRouter);

const { salesOrderRouter } = require('./salesOrder/salesOrder');
router.use('/salesOrder', salesOrderRouter);

const { purchaseOrderRouter } = require('./purchaseOrder/purchaseOrder');
router.use('/purchaseOrder', purchaseOrderRouter);

const { warehouseRouter } = require('./warehouse/warehouse');
router.use('/warehouse', warehouseRouter);

const { statisticRouter } = require('./statistic/statistic');
router.use('/statistic', statisticRouter);

module.exports = {
    apiV1Router: router
}