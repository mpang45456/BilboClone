const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { SalesOrderModel, 
        SalesOrderStateModel, 
        PurchaseOrderModel, 
        PurchaseOrderStateModel } = require('../../../../data/database');
const { SO_STATES } = require('../../../../data/databaseEnum');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { setUserHierarchy } = require('../user/hierarachy');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// NOTE: User Hierarchy is ignored for this API
/**
 * Mounted on /api/v1/warehouse/salesOrder
 * 
 * Gets sales order meta-data for all sales orders
 * whose latest status is `SO_STATES.PREPARING`.
 * 
 * Note: Users with PERMS.WAREHOUSE_READ are able
 * to circumvent the User Hierarchy and read sales order
 * meta data for all sales orders.
 * 
 * Note: Customer name is auto-populated. It must be
 * explicitly excluded via the query parameters
 * if the field is to be excluded.
 */
router.get('/',
           isAuthorized(PERMS.WAREHOUSE_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['createdBy', 'orderNumber', 'latestStatus', 'customer', 'additionalInfo', 'orders'],
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

    // Only select SOs that have PREPARING status
    filter.latestStatus = SO_STATES.PREPARING;

    // Convert to Number
    limit = Number(limit);
    page = Number(page);

    try {
        const options = {
            limit,  
            skip: (page - 1) * limit,
            sort: sort.join(' '),
        }
        let salesOrders = await SalesOrderModel.find(filter, inc.join(' '), options)
                                               .populate('customer', 'name');

        const totalNumSalesOrders = await SalesOrderModel.countDocuments(filter);
        return res.status(200).json({
            salesOrders,
            totalPages: Math.ceil(totalNumSalesOrders / limit),
            currentPage: page
        });
    } catch(err) {
        logger.error(`GET /warehouse/salesOrder: Could not get sales order meta-data: ${err}`);
        return res.sendStatus(400);
    }
})

/**
 * Mounted on /api/v1/warehouse/salesOrder/:salesOrderObjID
 * 
 * Returns sales order meta data and the latest state data
 * associated with the sales order identified by `:salesOrderObjID`
 * 
 * Note: The sales order meta data and latest sales order state
 * data must both have status SO_STATES.PREPARING, otherwise
 * a 403 response is returned.
 * 
 * Note: Response format:
 *  {
 *      <Meta-Data fields but excluding `orders`>
 *      state: { <State Data fields> }
 *  }
 */
router.get('/:salesOrderObjID',
           isAuthorized(PERMS.WAREHOUSE_READ),
           async function(req, res) {
    try {
        let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
        let salesOrderStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1]});
        
        if (!salesOrderDoc) { return res.status(400).send('Invalid Sales Order ID'); }

        // This endpoint only allows access to sales order meta-data that have PREPARING status
        if (salesOrderDoc.latestStatus !== SO_STATES.PREPARING) { return res.sendStatus(403); }
        // This endpoint only allows access to sales order state data that have PREPARING status
        if (salesOrderStateDoc.status !== SO_STATES.PREPARING) { return res.sendStatus(403); }

        const resBody = JSON.parse(JSON.stringify(salesOrderDoc));
        delete resBody.orders;
        resBody.state = JSON.parse(JSON.stringify(salesOrderStateDoc));
        return res.status(200).json(resBody);
    } catch(err) {
        logger.error(`GET /warehouse/salesOrder/:salesOrderObjID: Could not get sales order: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Sales Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Mounted on /api/v1/warehouse/salesOrder/:salesOrderObjID
 * 
 * Updates the status of the sales order from SO_STATES.CONFIRMEd
 * to SO_STATES.IN_DELIVERY. No other updates are allowed. 
 * 
 * Note: the sales order meta data's `latestStatus` is updated,
 * and a new sales order state is appended to state history. 
 */
router.patch('/:salesOrderObjID',
             isAuthorized(PERMS.WAREHOUSE_WRITE),
             async function(req, res) {
    const { newStatus } = req.body;
    if (newStatus !== SO_STATES.IN_DELIVERY) {
        return res.status(400).send('Next Status Must Be IN_DELIVERY');
    }

    try {
        let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
        let salesOrderStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1]});
    
        // Make a copy of the latest state and change status
        salesOrderStateDoc._doc._id = mongoose.Types.ObjectId();
        salesOrderStateDoc.isNew = true;
        salesOrderStateDoc.status = newStatus;
        // Update meta-data
        salesOrderDoc.latestStatus = newStatus;
        salesOrderDoc.orders.push(salesOrderStateDoc);
        await salesOrderStateDoc.save();
        await salesOrderDoc.save();

        return res.status(200).json(salesOrderStateDoc);
    } catch(err) {
        logger.error(`PATCH /warehouse/salesOrder/:salesOrderObjID: Could not update sales order: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Sales Order ID');
        }
        return res.sendStatus(500);
    }
})

module.exports = {
    warehouseSalesOrderRouter: router,
}
