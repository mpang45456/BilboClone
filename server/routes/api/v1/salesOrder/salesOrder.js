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

/**
 * Mounted on /api/v1/salesOrder
 * 
 * Returns salesOrder meta-data (on the collection
 * level). Request query string can specify:
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
           isAuthorized(PERMS.SALES_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['createdBy', 'latestStatus', 'customer', 'additionalInfo', 'orders'],
        sort = ['latestStatus'],
        filter = {} // FIXME: Using the req params directly as the filter to the Mongoose query might pose a significant security risk
    } = req.query;

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }
    if (!Array.isArray(sort)) { sort = [sort]; }

    // Convert filter to object
    if (typeof filter === 'string') {
        filter = JSON.parse(filter);
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
    } catch(err) {
        logger.error(`GET /salesOrder: Could not get sales order meta-data: ${err}`);
        return res.sendStatus(400);
    }
})

module.exports = {
    salesOrderRouter: router,
}
