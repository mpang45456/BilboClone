const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { SupplierModel, 
        PartModel, 
        CustomerModel, 
        SalesOrderModel, 
        SalesOrderStateModel, 
        PurchaseOrderModel, 
        PurchaseOrderStateModel } = require('../../../../data/database');
const { PO_STATES, SO_STATES } = require('../../../../data/databaseEnum');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { setUserHierarchy } = require('../user/hierarachy');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

router.get('/', 
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           async function(req, res) {
    res.send('hello world (purchase orders)')
})

module.exports = {
    purchaseOrderRouter: router,
}
