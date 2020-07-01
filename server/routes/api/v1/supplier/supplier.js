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
 * Request query string can specify: 
 * 1. Which fields to include (`inc`)
 *    - e.g. ?inc=name (single field)
 *    - e.g. ?inc=name&inc=telephone (multiple fields)
 *    - e.g. ?inc=-telephone (exclude telephone only)
 *    - the fields are safely included (i.e. if the field is missing
 *      in the database document, then it is simply not added to the
 *      response and will not throw an error)
 * 2. Sort order (`sort`)
 *    - e.g. ?sort=-name (descending order sort for `name`)
 *    - e.g. ?sort=name&sort=-telephone (multiple fields for sorting)
 * 3. Pagination (`page`, `limit`)
 *    - e.g. ?page=1&limit=20
 * 
 * Note: if `parts` is included in the query, 
 * note that it is not populated (i.e. the ObjectIDs 
 * will be present, but not the Part documents)
 */
router.get('/',
           isAuthorized(PERMS.SUPPLIER_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = CONFIG.DEFAULT_PAGE_LIMIT, 
        inc = ['name', 'address', 'telephone', 'fax', 'additionalInfo', 'parts'],
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
        return res.status(200).json(suppliers);
    } catch(err) {
        logger.error(`GET /supplier: Could not get suppliers: ${err}`);
        return res.sendStatus(500);
    }
})

/**
 * Mounted on /api/v1/supplier/:supplierObjID
 * 
 * Returns information on the specific supplier
 * identified by `supplierObjID`
 * 
 * Request query string can specify:
 * 1. Which fields to include (`inc`)
 * 
 * Note: if `parts` is included in the query, 
 * note that it is not populated (i.e. the ObjectIDs 
 * will be present, but not the Part documents)
 */
router.get('/:supplierObjID',
           isAuthorized(PERMS.SUPPLIER_READ), 
           async function(req, res) {
    let {
        inc = ['name', 'address', 'telephone', 'fax', 'additionalInfo', 'parts']
    } = req.query;

    try {
        let supplier = await SupplierModel.findOne({ _id: req.params.supplierObjID}, inc.join(' '));
        if (!supplier) {
            return res.status(400).send('Invalid supplier ID');
        }
        return res.status(200).json(supplier);
    } catch(err) {
        logger.error(`GET /supplier/:supplierObjID: Could not get supplier: ${err}`);
        return res.sendStatus(500);
    }
})


module.exports = {
    supplierRouter: router,
}