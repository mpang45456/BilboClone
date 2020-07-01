const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { SupplierModel, PartModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

/**
 * Mounted on /api/v1/part
 * 
 * Gets part information.
 * Request query string can specify: 
 * 1. Fields to include (`inc`)
 *    - e.g. ?inc=supplier (single field)
 *    - e.g. ?inc=supplier&inc=priceHistory (multiple fields)
 *    - e.g. ?inc=-priceHistory (exclude field)
 * 2. Fields to sort by
 *    - e.g. ?sort=status
 * 3. Pagination
 *    - e.g. ?page=3&limit=10
 * 
 * The query can also be filtered. The filter
 * must be provided in the BODY of the request,
 * not the query string. It must be provided in
 * JSON. All mongoose filter syntax is acceptable.
 * See `partAPI.test.js` for an example.
 * 
 * Note: The `supplier` path will not be populated.
 * Only the ObjectID in the `supplier` path will be
 * returned in the response (if included).
 */
router.get('/', 
           isAuthorized(PERMS.PART_READ),
           async function(req, res) {
    let {
        page = 1,
        limit = CONFIG.DEFAULT_PAGE_LIMIT,
        inc = ['supplier', 'partNumber', 'priceHistory', 'description', 'status', 'additionalInfo'],
        sort = ['status'],
    } = req.query;

    let filter = req.body; // FIXME: Using the req body directly as the filter to the Mongoose query might pose a significant security risk

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }
    if (!Array.isArray(sort)) { sort = [sort]; }

    try {
        const options = {
            limit: Number(limit), 
            skip: (Number(page) - 1) * Number(limit),
            sort: sort.join(' '),
        }
        let parts = await PartModel.find(filter, inc.join(' '), options);
        return res.status(200).json(parts);
    } catch(err) {
        logger.error(`GET /part: Could not get parts: ${err}`);
        return res.sendStatus(500);
    }
})

module.exports = {
    partRouter: router
}