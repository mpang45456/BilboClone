const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { CustomerModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

/**
 * Mounted on /api/v1/customer
 * 
 * Gets customer information. 
 * 
 * Request query string can specify: 
 * 1. Fields to include (`inc`)
 *    - e.g. ?inc=name (single field)
 *    - e.g. ?inc=name&inc=pointOfContact (multiple fields)
 *    - e.g. ?inc=-name (exclude field)
 * 2. Fields to sort by (`sort`)
 *    - e.g. ?sort=name
 * 3. Pagination (`page`, `limit`)
 *    - e.g. ?page=3&limit=10
 * 4. Filter (`filter`)
 *    - e.g. ?filter={"name":{"$regex":"Road$","$options":"i"},"pointOfContact":{"$regex":"Santiago","$options":"i"}}
 *      - Note: Remember to call JSON.stringify() on 
 *              the filter before sending in query string
 *    - All mongoose filter syntax is acceptable.
 *      See `customerAPI.test.js` for an example.
 *    - Only a SINGLE filter query is acceptable, 
 *      otherwise the conversion from String to Object
 *      will fail and a 400 status code response is sent.
 *      If multiple filters are required, simply construct
 *      a single filter that can account for all the
 *      required filters (must be valid Mongoose syntax)
 * 
 * Note: response includes `customers`, `totalPages` and
 * `currentPage`.
 */
router.get('/', 
           isAuthorized(PERMS.CUSTOMER_READ),
           async function(req, res) {
    let {
        page = 1,
        limit = CONFIG.DEFAULT_PAGE_LIMIT,
        inc = ['name', 'address', 'telephone', 
               'fax', 'email', 'pointOfContact', 
               'additionalInfo'],
        sort = ['name'],
        filter = {}, // FIXME: Using the req params directly as the filter to the Mongoose query might pose a significant security risk
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
            limit: limit, 
            skip: (page - 1) * limit,
            sort: sort.join(' '),
        }

        const customers = await CustomerModel.find(filter, inc.join(' '), options);
        const totalNumCustomers = await CustomerModel.countDocuments(filter);
        return res.status(200).json({
            customers,
            totalPages: Math.ceil(totalNumCustomers / limit),
            currentPage: page
        });
    } catch(err) {
        logger.error(`GET /customer: Could not get customers: ${err}`);
        return res.sendStatus(400);
    }
});

module.exports = {
    customerRouter: router
}