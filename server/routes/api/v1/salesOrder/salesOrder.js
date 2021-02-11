const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { PartModel,
    CustomerModel,
    SalesOrderModel,
    SalesOrderStateModel,
    PurchaseOrderModel,
    PurchaseOrderStateModel } = require('../../../../data/database');
const { SO_STATES } = require('../../../../data/databaseEnum');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { setUserHierarchy } = require('../user/hierarachy');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

// TODO: Consider implementing a DELETE method
/**
 * Mounted on /api/v1/salesOrder
 * 
 * Returns salesOrder meta-data (on the collection
 * level). Only data created by users under the
 * requesting user in the user hierarchy will be
 * returned.
 * 
 * Request query string can specify:
 * 1. Which fields to include (`inc`)
 *    - e.g. ?inc=createdBy (single field)
 *    - e.g. ?inc=createdBy&inc=latestStatus (multiple fields)
 *    - e.g. ?inc=-customer (exclude customer only)
 *    - the fields are safely included (i.e. if the field is missing
 *      in the database document, then it is simply not added to the
 *      response and will not throw an error)
 *    - because the customer's name is auto-populated, in order
 *      to exclude the customer information, an explicit exclusion
 *      is necessary (i.e. `?inc=-customer`)
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
 *      See `salesOrderAPI.test.js` for an example.
 *    - Only a SINGLE filter query is acceptable, 
 *      otherwise the conversion from String to Object
 *      will fail and a 400 status code response is sent.
 *      If multiple filters are required, simply construct
 *      a single filter that can account for all the
 *      required filters (must be valid Mongoose syntax)
 * 
 * Note: the `customer` field is automatically populated
 * with the `name` path. The current implementation does not
 * allow for further customisation ofthe population process.
 * This is meant more as a convenience so that an extra API
 * call to the customer API can ba avoided.
 * 
 * Note: response includes `salesOrders`, `totalPages` and
 * `currentPage`.
 */
router.get('/',
    isAuthorized(PERMS.SALES_ORDER_READ),
    setUserHierarchy,
    async function (req, res) {
        let {
            page = 1,
            limit = CONFIG.DEFAULT_PAGE_LIMIT,
            inc = ['createdBy', 'orderNumber', 'latestStatus', 'customer', 'additionalInfo', 'orders'],
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
        if (!filter.createdBy) {
            filter.createdBy = { "$in": req.userHierarchy };
        } else {
            filter.createdBy["$in"] = req.userHierarchy;
        }

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
        } catch (err) {
            logger.error(`GET /salesOrder: Could not get sales order meta-data: ${err}`);
            return res.sendStatus(400);
        }
    })

/**
 * Mounted on /api/v1/salesOrder
 * 
 * Creates a new sales order (meta-data). 
 * 
 * Only `customerName` and `additionalInfo` can be
 * specified by the request body in JSON. All other
 * field values will be ignored. This ensures that
 * `createdBy` will be the currently logged in user,
 * `latestStatus` will be SO_STATES.QUOTATION, and 
 * `orderNumber` will be generated by Bilbo. 
 * 
 * Note: An empty sales order state with status
 * SO_STATES.QUOTATION is added to the sales order
 * state history.
 * 
 * Note: This endpoint does not allow the client
 * to specify the `customerObjID` directly and 
 * instead performs a search for the `customerName`
 * because the former procedure will allow any string that 
 * satisifies Mongoose ObjectID requirements to be 
 * accepted when creating a new Mongoose document, even 
 * if the ObjectID specified does not belong to a 
 * customer document, leading to inconsistencies in
 * the `ref` in the database. 
 */
router.post('/',
    isAuthorized(PERMS.SALES_ORDER_WRITE),
    async function (req, res) {
        const { customerName, additionalInfo } = req.body;
        try {
            const customerDoc = await CustomerModel.findOne({ name: customerName });
            if (!customerDoc) { return res.status(400).send('Customer not found'); }

            const newSalesOrder = new SalesOrderModel({
                createdBy: req.user.username,
                latestStatus: SO_STATES.QUOTATION,
                customer: customerDoc.id,
                additionalInfo,
                orders: []
            })
            const newSalesOrderState = new SalesOrderStateModel({
                status: SO_STATES.QUOTATION,
                additionalInfo: '',
                parts: [],
                updatedBy: req.user.username
            });

            await newSalesOrderState.save();
            newSalesOrder.orders.push(newSalesOrderState);
            await newSalesOrder.setOrderNumber()
            await newSalesOrder.save();

            return res.status(200).json(newSalesOrder);
        } catch (err) {
            // No checks for duplicate order number because they are 
            // generated by the system and guaranteed to be unique
            logger.error(`POST /salesOrder: Could not create new salesOrder: ${err}`);
            return res.status(400).send('Unable to create new salesOrder');
        }
    })

/**
 * Mounted on /api/v1/salesOrder/:salesOrderObjID
 * 
 * Returns sales order meta data for the individual
 * resource identified by `salesOrderObjID`. The 
 * requesting user will only be able to access the resource
 * if it is created by a user under the requesting
 * user in the user hierarchy. Otherwise, a 403 
 * response is sent.
 * 
 * Note: No query string support is enabled for this 
 * method.
 * 
 * Note: the `customer`'s `name` path is auto-populated
 * in every response.
 */
router.get('/:salesOrderObjID',
    isAuthorized(PERMS.SALES_ORDER_READ),
    setUserHierarchy,
    async function (req, res) {
        try {
            let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID })
                .populate('customer', 'name');
            if (!salesOrderDoc) {
                return res.status(400).send('Invalid Sales Order ID');
            }
            if (!req.userHierarchy.includes(salesOrderDoc.createdBy)) {
                return res.sendStatus(403);
            }

            return res.status(200).json(salesOrderDoc);
        } catch (err) {
            logger.error(`GET /salesOrder/:salesOrderObjID: Could not get sales order: ${err}`);
            if (err instanceof mongoose.Error.CastError) {
                return res.status(400).send('Invalid Sales Order ID');
            }
            return res.sendStatus(500);
        }
    })

/**
 * Mounted on '/api/v1/salesOrder/:salesOrderObjID/state
 * 
 * Returns sales order state data for the sales order
 * identified by `salesOrderObjID`. Hence, this provides
 * a history of changes to the state of the sales order.
 * 
 * Request query string can specify:
 * 1. Which fields to include in sales order state (`inc`):
 *    - The granularity is up till `SalesOrderStateSchema`
 *      Hence, if including `parts`, then both `SalesOrderPartInfo`
 *      and `SalesOrderPartFulfillment` will be automatically
 *      included. 
 *    - can include `createdAt` and `updatedAt` as well
 * 
 * Note: no pagination, filtering or sorting is enabled
 * for this method. 
 * 
 * Note: The sales order must be created by a user within
 * the requesting user's user hierarchy in order to be 
 * authorized to access this resource. In other words, there 
 * are 2 layers of authorization: 
 * 1. PERMS.SALES_ORDER_READ, then
 * 2. User hierarchy checks
 */
router.get('/:salesOrderObjID/state',
    isAuthorized(PERMS.SALES_ORDER_READ),
    setUserHierarchy,
    async function (req, res) {
        try {
            let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
            // Check if user is within user hierarchy for sales order
            if (!req.userHierarchy.includes(salesOrderDoc.createdBy)) {
                return res.status(403).send('Unauthorized: User Hierarchy');
            }

            // Query Parameters
            let {
                inc = ['status', 'additionalInfo', 'parts', 'updatedBy'],
            } = req.query;

            // Convert `inc` to array if only a single field is specified
            if (!Array.isArray(inc)) { inc = [inc]; }

            await salesOrderDoc.populate('orders', inc.join(' ')).execPopulate();
            return res.status(200).json(salesOrderDoc.orders);
        } catch (err) {
            logger.error(`GET /salesOrder/:salesOrderObjID/state: Could not get sales order states: ${err}`);
            if (err instanceof mongoose.Error.CastError) {
                return res.status(400).send('Invalid Sales Order ID');
            }
            return res.sendStatus(500);
        }
    })

/**
 * Creates a new state for the sales order identified
 * by `:salesOrderObjID`. The new state will be appended
 * to the sales order. No changes are ever made to sales
 * order state data in-place.
 * 
 * Note: allocations are driven by the SO. The PO is
 * relatively 'dumb' and does not perform allocation logic.
 * 
 * Note: To perform parts allocation, status MUST be 
 * set to `CONFIRMED`
 * 
 * State data: 
 * - new state is appended to sales order. No changes 
 *   are ever made to existing sales order state data
 *   in-place.
 * - performs reversions if the new state has CONFIRMED
 *   status and latest state also has CONFIRMED status
 * - performs allocations if the new state has CONFIRMED
 *   status
 * 
 * Meta data: 
 * - `latestStatus` is updated to the new state's
 *   `status`
 * - `orders` is appended with the new state
 * 
 * // TODO: Perform verification checks
 * - `parts` in `req.body` must have correct format
 * - objectIDs specified in request must actually correspond
 *   to a document of the correct Schema
 * - there should be sufficient quantities of a part 
 *   in the PO to be allocated
 * - PO actually contains the part
 * - handle concurrency problems: lock the document? Minimise number of writes required per request?
 * - status can only move forward.
 */
router.post('/:salesOrderObjID/state',
    isAuthorized(PERMS.SALES_ORDER_WRITE),
    setUserHierarchy,
    async function (req, res) {
        try {
            // Check for valid Sales Order document
            let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
            if (!salesOrderDoc) {
                return res.status(400).send('Invalid Sales Order ID');
            }

            // Check if user is within user hierarchy for sales order
            if (!req.userHierarchy.includes(salesOrderDoc.createdBy)) {
                return res.status(403).send('Unauthorized: User Hierarchy');
            }

            let { status, additionalInfo, parts } = req.body;
            const newSOStateDoc = new SalesOrderStateModel({
                status: status || salesOrderDoc.latestStatus,
                additionalInfo,
                parts,
                updatedBy: req.user.username
            });
            // Check that partObjID is valid and corresponds to an actual part
            for (let part of parts) {
                const partDoc = await PartModel.findOne({ _id: part.part });
                if (!partDoc) { return res.status(400).send('Invalid Part ID'); }
                let data = await PartModel.findOneAndUpdate({ _id: part.part }, {
                    "$push": {
                        priceHistory: {
                            createdBy: req.user.username,
                            unitPrice: partDoc.priceHistory[partDoc.priceHistory.length - 1].unitPrice,
                            unitPurchasePrice: partDoc.priceHistory[partDoc.priceHistory.length - 1].unitPurchasePrice,
                            unitSellingPrice: part.unitSellingPrice ? part.unitSellingPrice : (part.latestPrice ? part.latestPrice : partDoc.priceHistory[partDoc.priceHistory.length - 1].unitSellingPrice),
                            additionalInfo: "Sales order Price Update"
                        }
                    }
                }, { new: true })
            }

            // Perform Allocation of Parts to Purchase Orders
            if (status === SO_STATES.CONFIRMED) {
                // Allocation is only performed if the new state status is CONFIRMED
                const latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] });

                // Reversion is only necessary if the previous state also had CONFIRMED status
                // Because allocation is only performed if status is CONFIRMED
                if (latestSOStateDoc.status === SO_STATES.CONFIRMED) {
                    await revertAllocations(latestSOStateDoc, salesOrderDoc._id);
                }

                performAllocations(parts, salesOrderDoc._id);
            }

            // Update Sales Order Meta Data
            salesOrderDoc.latestStatus = status;
            salesOrderDoc.orders.push(newSOStateDoc);
            await salesOrderDoc.save();
            await newSOStateDoc.save();

            return res.status(200).json(newSOStateDoc);
        } catch (err) {
            logger.error(`POST /salesOrder/:salesOrderObjID/state: Could not create new sales order state: ${err}`);
            if (err instanceof mongoose.Error.CastError) {
                return res.status(400).send('Invalid Sales Order ID');
            }
            return res.sendStatus(500);
        }
    })

/**
 * Revert the allocations stated in `soStateDoc`.
 * 
 * Note: it is assumed that the allocations stated in
 * `soStateDoc` were actually performed.
 * 
 * Note: `soStateDoc` must be of schme `SalesOrderStateSchema`
 * @param {Mongoose Document} soStateDoc 
 */
async function revertAllocations(soStateDoc, salesOrderObjID) {
    // Find Purchase Orders associated with Sales Order State
    // (because 1 SO can be fulfilled by multiple POs)
    let allPOs = soStateDoc.parts.map(partInfo => {
        return partInfo.fulfilledBy.map(fulfilledByTarget => String(fulfilledByTarget.purchaseOrder));
    }).flat();
    let allUniquePOs = Array.from(new Set(allPOs));

    // Perform reversions
    for (let poObjID of allUniquePOs) {
        let poDoc = await PurchaseOrderModel.findOne({ _id: poObjID });
        let poLatestStateDoc = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1] });
        poLatestStateDoc.parts.map(partInfo => {
            // Remove the fulfillments associated with the SO
            partInfo.fulfilledFor = partInfo.fulfilledFor.filter(fulfilledForTarget => {
                String(fulfilledForTarget.salesOrder) !== salesOrderObjID;
            })
        })
        await poLatestStateDoc.save();
    }
}

/**
 * Iterates through the part allocations in the sales
 * order's `partInfos` and updates the latest purchase 
 * order state in-place.
 * 
 * Note: SO-PO relations are many-many relations. So
 * 1 SO's `partInfos` can cause updates in multiple POs.
 * @param {} partInfos 
 * @param {*} salesOrderObjID 
 */
function performAllocations(partInfos, salesOrderObjID) {
    return Promise.all(partInfos.map(async soPartInfo => {
        for (let fulfilledByTarget of soPartInfo.fulfilledBy) {
            let poDoc = await PurchaseOrderModel.findOne({ _id: fulfilledByTarget.purchaseOrder });
            let poLatestStateDoc = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1] });
            let index = poLatestStateDoc.parts.findIndex(poPartInfo => {
                return String(poPartInfo.part) === String(soPartInfo.part);
            })
            poLatestStateDoc.parts[index].fulfilledFor.push({
                salesOrder: salesOrderObjID,
                quantity: fulfilledByTarget.quantity,
            })
            await poLatestStateDoc.save();
        }
    }))
}

/**
 * Mounted on /api/v1/salesOrder/:salesOrderObjID/state/latest
 * 
 * Returns latest sales order state data for the sales
 * order identified by `:salesOrderObjID`
 * 
 * Query parameters can specify: 
 * 1. Whether to populate the `fulfilledBy` path array
 *    - ?populateFulfilledBy=true
 * 
 * Note: Authorization is performed in the following order:
 * 1. User has `PERMS.SALES_ORDER_READ`
 * 2. Sales order associated with `:salesOrderObjID` was
 *    created by a user in the requesting user's user hierarchy
 */
router.get('/:salesOrderObjID/state/latest',
    isAuthorized(PERMS.SALES_ORDER_READ),
    setUserHierarchy,
    async function (req, res) {
        try {
            // Query Parameters
            let {
                populateFulfilledBy = 'false',
            } = req.query;

            let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
            if (!salesOrderDoc) { return res.status(400).send('Invalid Sales Order ID'); }

            // Check if user is within user hierarchy for sales order
            if (!req.userHierarchy.includes(salesOrderDoc.createdBy)) {
                return res.status(403).send('Unauthorized: User Hierarchy');
            }

            const latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] });
            if (populateFulfilledBy === 'true') {
                await latestSOStateDoc.populate('parts.fulfilledBy.purchaseOrder').execPopulate();
            }

            return res.status(200).json(latestSOStateDoc);
        } catch (err) {
            logger.error(`GET /salesOrder/:salesOrderObjID/state/latest: Could not get latest sales order state: ${err}`);
            if (err instanceof mongoose.Error.CastError) {
                return res.status(400).send('Invalid Sales Order ID');
            }
            return res.sendStatus(500);
        }
    })

/**
 * Mounted on /api/v1/salesOrder/:salesOrderObjID/state/:index
 * 
 * Returns sales order state data at `:index` for the sales
 * order identified by `:salesOrderObjID`
 * 
 * Query parameters can specify: 
 * 1. Whether to populate the `fulfilledBy` path array
 *    - ?populateFulfilledBy=true
 * 
 * Note: Authorization is performed in the following order:
 * 1. User has `PERMS.SALES_ORDER_READ`
 * 2. Sales order associated with `:salesOrderObjID` was
 *    created by a user in the requesting user's user hierarchy
 * 
 * Note: If the index corresponds to a sales order state 
 * that does not exist, then `null` is returned in the 
 * response. 
 */
router.get('/:salesOrderObjID/state/:salesOrderStateIndex',
    isAuthorized(PERMS.SALES_ORDER_READ),
    setUserHierarchy,
    async function (req, res) {
        try {
            // Query Parameters
            let {
                populateFulfilledBy = 'false',
            } = req.query;

            let salesOrderDoc = await SalesOrderModel.findOne({ _id: req.params.salesOrderObjID });
            if (!salesOrderDoc) { return res.status(400).send('Invalid Sales Order ID'); }

            // Check if user is within user hierarchy for sales order
            if (!req.userHierarchy.includes(salesOrderDoc.createdBy)) {
                return res.status(403).send('Unauthorized: User Hierarchy');
            }

            const soStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[Number(req.params.salesOrderStateIndex)] });
            if (populateFulfilledBy === 'true') {
                await soStateDoc.populate('parts.fulfilledBy.purchaseOrder').execPopulate();
            }

            return res.status(200).json(soStateDoc);
        } catch (err) {
            logger.error(`GET /:salesOrderObjID/state/:salesOrderStateObjID: Could not get sales order state: ${err}`);
            if (err instanceof mongoose.Error.CastError) {
                return res.status(400).send('Invalid sales order meta-data/state ID');
            }
            return res.sendStatus(500);
        }
    })

module.exports = {
    salesOrderRouter: router,
}
