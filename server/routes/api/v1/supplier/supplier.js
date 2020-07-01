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
 * Mounted on: /api/v1/supplier
 * 
 * Returns information on the supplier collection.
 * Request can specify: 
 * 1. Which fields to include (`inc`)
 *    - e.g. ?inc=name (single field)
 *    - e.g. ?inc=name&inc=telephone (multiple fields)
 *    - the fields are safely included (i.e. if the field is missing
 *      in the database document, then it is simply not added to the
 *      response and will not throw an error)
 * 2. Sort order (`sort`)
 *    - e.g. ?sort=-name (descending order sort for `name`)
 *    - e.g. ?sort=name&sort=-telephone (multiple fields for sorting)
 * 3. Pagination
 *    - e.g. ?page=1&limit=20
 */
router.get('/',
           isAuthorized(PERMS.SUPPLIER_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['name', 'address', 'telephone', 'fax', 'additionalInfo'],
        sort = ['name']
    } = req.query;

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }
    if (!Array.isArray(sort)) { sort = [sort]; }

    try {
        const options = {
            limit: Number(limit), 
            skip: (Number(page) - 1) * Number(limit),
            sort: sort.join(' '),
        }
        let suppliers = await SupplierModel.find({}, inc.join(' '), options);
        res.status(200).json(suppliers);
    } catch(err) {
        logger.error(`GET /supplier: Could not get suppliers: ${err}`);
        res.sendStatus(500);
    }
})


module.exports = {
    supplierRouter: router,
}