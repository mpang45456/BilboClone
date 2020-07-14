const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { SupplierModel, PartModel, SalesOrderModel, SalesOrderStateModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

router.get('/', 
           isAuthorized(PERMS.SALES_READ),
           function(req, res) {
    res.send('hello world');
})

module.exports = {
    salesOrderRouter: router,
}
