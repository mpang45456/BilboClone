const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { PurchaseOrderModel, 
        PurchaseOrderStateModel } = require('../../../../data/database');
const { PO_STATES } = require('../../../../data/databaseEnum');
const { isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// NOTE: User Hierarchy is ignored for this API
/**
 * Mounted on /api/v1/warehouse/purchaseOrder
 * 
 * Gets purchase order meta-data for all purchase orders
 * whose latest status is `PO_STATES.CONFIRMED`.
 * 
 * Note: Users with PERMS.WAREHOUSE_READ are able
 * to circumvent the User Hierarchy and read purchase order
 * meta data for all purchase orders.
 * 
 * Note: Supplier name is auto-populated. It must be
 * explicitly excluded via the query parameters
 * if the field is to be excluded.
 */
router.get('/',
           isAuthorized(PERMS.WAREHOUSE_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['createdBy', 'orderNumber', 'latestStatus', 'supplier', 'additionalInfo', 'orders'],
        sort = ['orderNumber'],
        filter = {} // FIXME: Using the req params directly as the filter to the Mongoose query might pose a significant security risk
    } = req.query;

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }
    if (!Array.isArray(sort)) { sort = [sort]; }

    // Convert filter to object
    if (typeof filter === 'string') {
        filter = JSON.parse(filter);
    }

    // Only select POs that have CONFIRMED status
    filter.latestStatus = PO_STATES.CONFIRMED;

    // Convert to Number
    limit = Number(limit);
    page = Number(page);

    try {
        const options = {
            limit,  
            skip: (page - 1) * limit,
            sort: sort.join(' '),
        }
        let purchaseOrders = await PurchaseOrderModel.find(filter, inc.join(' '), options)
                                                     .populate('supplier', 'name');

        const totalNumPurchaseOrders = await PurchaseOrderModel.countDocuments(filter);
        return res.status(200).json({
            purchaseOrders,
            totalPages: Math.ceil(totalNumPurchaseOrders / limit),
            currentPage: page
        });
    } catch(err) {
        logger.error(`GET /warehouse/purchaseOrder: Could not get purchase order meta-data: ${err}`);
        return res.sendStatus(400);
    }
})

/**
 * Mounted on /api/v1/warehouse/purchaseOrder/:purchaseOrderObjID
 * 
 * Returns purchase order meta data and the latest state data
 * associated with the purchase order identified by `:purchaseOrderObjID`
 * 
 * Note: The purchase order meta data and latest purchase order state
 * data must both have status PO_STATES.CONFIRMED, otherwise
 * a 403 response is returned.
 * 
 * Note: Response format:
 *  {
 *      <Meta-Data fields but excluding `orders`>
 *      state: { <State Data fields> }
 *  }
 */
router.get('/:purchaseOrderObjID',
           isAuthorized(PERMS.WAREHOUSE_READ),
           async function(req, res) {
    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID })
                                                       .populate('supplier');
        let purchaseOrderStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc.orders[purchaseOrderDoc.orders.length - 1]})
                                                                 .populate('parts.part')
                                                                 .populate('parts.fulfilledFor.salesOrder');
        await purchaseOrderStateDoc.populate('parts.part.supplier').execPopulate();

        if (!purchaseOrderDoc) { return res.status(400).send('Invalid Purchase Order ID'); }

        // This endpoint only allows access to purchase order meta-data that have CONFIRMED status
        if (purchaseOrderDoc.latestStatus !== PO_STATES.CONFIRMED) { return res.sendStatus(403); }
        // This endpoint only allows access to purchase order state data that have CONFIRMED status
        if (purchaseOrderStateDoc.status !== PO_STATES.CONFIRMED) { return res.sendStatus(403); }

        const resBody = JSON.parse(JSON.stringify(purchaseOrderDoc));
        delete resBody.orders;
        resBody.state = JSON.parse(JSON.stringify(purchaseOrderStateDoc));
        return res.status(200).json(resBody);
    } catch(err) {
        logger.error(`GET /warehouse/purchaseOrder/:purchaseOrderObjID: Could not get purchase order: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Mounted on /api/v1/warehouse/purchaseOrder/:purchaseOrderObjID
 * 
 * Updates the status of the purchase order from PO_STATES.CONFIRMED
 * to PO_STATES.RECEIVED. No other updates are allowed. 
 * 
 * Note: the purchase order meta data's `latestStatus` is updated,
 * and a new purchase order state is appended to state history. 
 */
router.patch('/:purchaseOrderObjID',
             isAuthorized(PERMS.WAREHOUSE_WRITE),
             async function(req, res) {
    const { newStatus } = req.body;
    if (newStatus !== PO_STATES.RECEIVED) {
        return res.status(400).send('Next Status Must Be RECEIVED');
    }

    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID });
        let purchaseOrderStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc.orders[purchaseOrderDoc.orders.length - 1]});
    
        // Make a copy of the latest state, change `status` and `updatedBy`
        purchaseOrderStateDoc._doc._id = mongoose.Types.ObjectId();
        purchaseOrderStateDoc.isNew = true;
        purchaseOrderStateDoc.status = newStatus;
        purchaseOrderStateDoc.updatedBy = req.user.username;
        // Update meta-data
        purchaseOrderDoc.latestStatus = newStatus;
        purchaseOrderDoc.orders.push(purchaseOrderStateDoc);
        await purchaseOrderStateDoc.save();
        await purchaseOrderDoc.save();

        return res.status(200).json(purchaseOrderStateDoc);
    } catch(err) {
        logger.error(`PATCH /warehouse/purchaseOrder/:purchaseOrderObjID: Could not update purchase order: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

module.exports = {
    warehousePurchaseOrderRouter: router,
}
