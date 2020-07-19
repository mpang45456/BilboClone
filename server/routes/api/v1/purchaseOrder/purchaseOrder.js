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

/**
 * Mounted on /api/v1/purchaseOrder
 * 
 * Returns purchase order meta-data (on the collection
 * level). Only data created by users under the
 * requesting user in the user hierarchy will be
 * returned.
 * 
 * Request query string can specify:
 * 1. Which fields to include (`inc`)
 *    - e.g. ?inc=createdBy (single field)
 *    - e.g. ?inc=createdBy&inc=latestStatus (multiple fields)
 *    - e.g. ?inc=-supplier (exclude supplier only)
 *    - the fields are safely included (i.e. if the field is missing
 *      in the database document, then it is simply not added to the
 *      response and will not throw an error)
 *    - because the supplier's name is auto-populated, in order
 *      to exclude the supplier information, an explicit exclusion
 *      is necessary (i.e. `?inc=-supplier`)
 * 2. Sort order (`sort`)
 *    - e.g. ?sort=-createdBy (descending order sort for `createdBy`)
 *    - e.g. ?sort=createdBy&sort=-latestStatus (multiple fields for sorting)
 * 3. Pagination (`page`, `limit`)
 *    - e.g. ?page=1&limit=20
 * * 4. Filter (`filter`)
 *    - e.g. ?filter={"createdBy":{"$regex":"admin","$options":"i"}}
 *      - Note: Remember to call JSON.stringify() on 
 *              the filter before sending in query string
 *    - All mongoose filter syntax is acceptable.
 *      See `purchaseOrderAPI.test.js` for an example.
 *    - Only a SINGLE filter query is acceptable, 
 *      otherwise the conversion from String to Object
 *      will fail and a 400 status code response is sent.
 *      If multiple filters are required, simply construct
 *      a single filter that can account for all the
 *      required filters (must be valid Mongoose syntax)
 * 
 * Note: the `supplier` field is automatically populated
 * with the `name` path. The current implementation does not
 * allow for further customisation ofthe population process.
 * This is meant more as a convenience so that an extra API
 * call to the supplier API can ba avoided.
 * 
 * Note: No filtering is allowed on the `createdBy` path.
 * Any filter on the path will be overwritten by the user
 * hierarchy filter. 
 * 
 * Note: response includes `purchaseOrders`, `totalPages` and
 * `currentPage`.
 */
router.get('/', 
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           setUserHierarchy, 
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['createdBy', 'orderNumber', 'latestStatus', 'supplier', 'additionalInfo', 'orders'],
        sort = ['latestStatus', 'orderNumber'],
        filter = {} // FIXME: Using the req params directly as the filter to the Mongoose query might pose a significant security risk
    } = req.query;

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }
    if (!Array.isArray(sort)) { sort = [sort]; }

    // Convert filter to object
    if (typeof filter === 'string') {
        filter = JSON.parse(filter);
    }

    // Add UserHierarchy to Filter
    filter.createdBy = { "$in": req.userHierarchy };

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
        logger.error(`GET /purchaseOrder: Could not get purchase order meta-data: ${err}`);
        return res.sendStatus(400);
    }
})

/**
 * Mounted on /api/v1/purchaseOrder
 * 
 * Creates a new purchase order (meta-data). 
 * 
 * Only `supplierName` and `additionalInfo` can be
 * specified by the request body in JSON. All other
 * field values will be ignored. This ensures that
 * `createdBy` will be the currently logged in user,
 * `latestStatus` will be PO_STATES.QUOTATION, and 
 * `orderNumber` will be generated by Bilbo. 
 * 
 * Note: An empty purchase order state with status
 * PO_STATES.QUOTATION is added to the purchase order
 * state history.
 * 
 * Note: This endpoint does not allow the client
 * to specify the `supplierObjID` directly and 
 * instead performs a search for the `supplierName`
 * because the former procedure will allow any string that 
 * satisifies Mongoose ObjectID requirements to be 
 * accepted when creating a new Mongoose document, even 
 * if the ObjectID specified does not belong to a 
 * supplier document, leading to inconsistencies in
 * the `ref` in the database. 
 */
router.post('/',
            isAuthorized(PERMS.PURCHASE_ORDER_WRITE),
            async function(req, res) {
    const { supplierName, additionalInfo } = req.body;
    try {
        const supplierDoc = await SupplierModel.findOne({ name: supplierName });
        if (!supplierDoc) { return res.status(400).send('Supplier not found'); }

        const newPurchaseOrder = new PurchaseOrderModel({ createdBy: req.user.username,
                                                          latestStatus: PO_STATES.QUOTATION, 
                                                          supplier: supplierDoc.id,
                                                          additionalInfo,
                                                          orders: [] })
        const newPurchaseOrderState = new PurchaseOrderStateModel({ 
                                            status: PO_STATES.QUOTATION,
                                            additionalInfo: '',
                                            parts: [],
                                            updatedBy: req.user.username });
        await newPurchaseOrderState.save();
        newPurchaseOrder.orders.push(newPurchaseOrderState);
        await newPurchaseOrder.setOrderNumber()
        await newPurchaseOrder.save();
        
        return res.status(200).json(newPurchaseOrder);
    } catch(err) {
        // No checks for duplicate order number because they are 
        // generated by the system and guaranteed to be unique
        logger.error(`POST /purchaseOrder: Could not create new purchase order: ${err}`);
        return res.status(400).send('Unable to create new purchase order');
    }
})

/**
 * Mounted on /api/v1/purchaseOrder/:purchaseOrderObjID
 * 
 * Returns purchase order meta data for the individual
 * resource identified by `purchaseOrderObjID`. The 
 * requesting user will only be able to access the resource
 * if it is created by a user under the requesting
 * user in the user hierarchy. Otherwise, a 403 
 * response is sent.
 * 
 * Note: No query string support is enabled for this 
 * method.
 * 
 * Note: the `supplier`'s `name` path is auto-populated
 * in every response.
 */
router.get('/:purchaseOrderObjID',
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           setUserHierarchy, 
           async function(req, res) {
    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID })
                                                       .populate('supplier', 'name');
        if (!purchaseOrderDoc) { 
            return res.status(400).send('Invalid Purchase Order ID'); 
        }
        if (!req.userHierarchy.includes(purchaseOrderDoc.createdBy)) { 
            return res.sendStatus(403); 
        }

        return res.status(200).json(purchaseOrderDoc);
    } catch(err) {
        logger.error(`GET /purchaseOrder/:purchaseOrderObjID: Could not get purchase order: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Mounted on '/api/v1/purchaseOrder/:purchaseOrderObjID/state
 * 
 * Returns purchase order state data for the purchase order
 * identified by `purchaseOrderObjID`. Hence, this provides
 * a history of changes to the state of the purchase order.
 * 
 * Request query string can specify:
 * 1. Which fields to include in purchase order state (`inc`):
 *    - The granularity is up till `PurchaseOrderStateSchema`
 *      Hence, if including `parts`, then both `PurchaseOrderPartInfo`
 *      and `PurchaseOrderPartFulfillment` will be automatically
 *      included. 
 *    - can include `createdAt` and `updatedAt` as well
 * 
 * Note: no pagination, filtering or sorting is enabled
 * for this method. 
 * 
 * Note: The purchase order must be created by a user within
 * the requesting user's user hierarchy in order to be 
 * authorized to access this resource. In other words, there 
 * are 2 layers of authorization: 
 * 1. PERMS.PURCHASE_ORDER_READ, then
 * 2. User hierarchy checks
 */
router.get('/:purchaseOrderObjID/state',
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           setUserHierarchy,
           async function(req, res) {
    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID });
        // Check if user is within user hierarchy for purchase order
        if (!req.userHierarchy.includes(purchaseOrderDoc.createdBy)) { 
            return res.status(403).send('Unauthorized: User Hierarchy'); 
        }

        // Query Parameters
        let {
            inc = ['status', 'additionalInfo', 'parts', 'updatedBy'],
        } = req.query;
    
        // Convert `inc` to array if only a single field is specified
        if (!Array.isArray(inc)) { inc = [inc]; }
    
        await purchaseOrderDoc.populate('orders', inc.join(' ')).execPopulate();
        return res.status(200).json(purchaseOrderDoc.orders);
    } catch (err) {
        logger.error(`GET /purchaseOrder/:purchaseOrderObjID/state: Could not get purchase order states: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Creates a new state for the purchase order identified
 * by `:purchaseOrderObjID`. The new state will be appended
 * to the purchase order. No changes are ever made to purchase
 * order state data in-place.
 * 
 * Note: allocations are driven by the SO. The PO is
 * relatively 'dumb' and does not perform allocation logic.
 * 
 * Note: To be eligible for parts allocation, PO status 
 * must be set to `CONFIRMED` (but this is driven by the 
 * SO side, not by the PO API) // FIXME: Not Yet Implemented
 * 
 * State data: 
 * - new state is appended to purchase order. No changes 
 *   are ever made to existing purchase order state data
 *   in-place.
 * 
 * Meta data: 
 * - `latestStatus` is updated to the new state's
 *   `status`
 * - `orders` is appended with the new state
 */
router.post('/:purchaseOrderObjID/state',
            isAuthorized(PERMS.PURCHASE_ORDER_WRITE),
            setUserHierarchy,
            async function(req, res) {
    try {
        // Check for valid Purchase Order document
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID });
        if (!purchaseOrderDoc) { 
            return res.status(400).send('Invalid Purchase Order ID'); 
        }
        
        // Check if user is within user hierarchy for purchase order
        if (!req.userHierarchy.includes(purchaseOrderDoc.createdBy)) { 
            return res.status(403).send('Unauthorized: User Hierarchy'); 
        }

        let { status, additionalInfo, parts } = req.body;
        const newPOStateDoc = new PurchaseOrderStateModel({ status: status || purchaseOrderDoc.latestStatus, 
                                                            additionalInfo, 
                                                            parts,
                                                            updatedBy: req.user.username });
        
        // Check that partObjID is valid and corresponds to an actual part
        for (let part of parts) {
            const partDoc = await PartModel.findOne({ _id: part.part });
            if (!partDoc) { return res.status(400).send('Invalid Part ID'); }
        }
                                                        
        // Update Purchase Order Meta Data
        purchaseOrderDoc.latestStatus = status;
        purchaseOrderDoc.orders.push(newPOStateDoc);
        await purchaseOrderDoc.save();
        await newPOStateDoc.save();

        return res.status(200).json(newPOStateDoc);
    } catch (err) {
        logger.error(`POST /purchaseOrder/:purchaseOrderObjID/state: Could not create new purchase order state: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Mounted on /api/v1/purchaseOrder/:purchaseOrderObjID/state/latest
 * 
 * Returns latest purchase order state data for the purchase
 * order identified by `:purchaseOrderObjID`
 * 
 * Note: Authorization is performed in the following order:
 * 1. User has `PERMS.PURCHASE_ORDER_READ`
 * 2. Purchase order associated with `:purchaseOrderObjID` was
 *    created by a user in the requesting user's user hierarchy
 */
router.get('/:purchaseOrderObjID/state/latest',
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           setUserHierarchy,
           async function(req, res) {
    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID });
        if (!purchaseOrderDoc) { return res.status(400).send('Invalid Purchase Order ID'); }
        
        // Check if user is within user hierarchy for purchase order
        if (!req.userHierarchy.includes(purchaseOrderDoc.createdBy)) { 
            return res.status(403).send('Unauthorized: User Hierarchy'); 
        }

        const latestPOStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc.orders[purchaseOrderDoc.orders.length - 1]});
        return res.status(200).json(latestPOStateDoc);
    } catch(err) {
        logger.error(`GET /purchaseOrder/:purchaseOrderObjID/state/latest: Could not get latest purchase order state: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid Purchase Order ID');
        }
        return res.sendStatus(500);
    }
})

/**
 * Mounted on /api/v1/purchaseOrder/:purchaseOrderObjID/state/:index
 * 
 * Returns purchase order state data at `:index` for the purchase
 * order identified by `:purchaseOrderObjID`
 * 
 * Note: Authorization is performed in the following order:
 * 1. User has `PERMS.PURCHASE_ORDER_READ`
 * 2. Purchase order associated with `:purchaseOrderObjID` was
 *    created by a user in the requesting user's user hierarchy
 * 
 * Note: If the index corresponds to a purchase order state 
 * that does not exist, then `null` is returned in the 
 * response. 
 */
router.get('/:purchaseOrderObjID/state/:purchaseOrderStateIndex',
           isAuthorized(PERMS.PURCHASE_ORDER_READ),
           setUserHierarchy,
           async function(req, res) {
    try {
        let purchaseOrderDoc = await PurchaseOrderModel.findOne({ _id: req.params.purchaseOrderObjID });
        if (!purchaseOrderDoc) { return res.status(400).send('Invalid Purchase Order ID'); }
        
        // Check if user is within user hierarchy for purchase order
        if (!req.userHierarchy.includes(purchaseOrderDoc.createdBy)) { 
            return res.status(403).send('Unauthorized: User Hierarchy'); 
        }

        const poStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc.orders[Number(req.params.purchaseOrderStateIndex)] });
        return res.status(200).json(poStateDoc);
    } catch(err) {
        logger.error(`GET /:purchaseOrderObjID/state/:purchaseOrderStateObjID: Could not get purchase order state: ${err}`);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).send('Invalid purchase order meta-data/state ID');
        }
        return res.sendStatus(500);
    }
})

module.exports = {
    purchaseOrderRouter: router,
}
