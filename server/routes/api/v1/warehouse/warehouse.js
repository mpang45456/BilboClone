const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../auth/auth');

// Set Up Router
router.use(isAuthenticated);

const { warehouseSalesOrderRouter } = require('./warehouseSalesOrder');
router.use('/salesOrder', warehouseSalesOrderRouter);

const { warehousePurchaseOrderRouter } = require('./warehousePurchaseOrder');
router.use('/purchaseOrder', warehousePurchaseOrderRouter);

module.exports = {
    warehouseRouter: router,
}
