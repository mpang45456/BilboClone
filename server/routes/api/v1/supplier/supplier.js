const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { SupplierModel, PartModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');

// Router Set-Up
router.use(isAuthenticated);

/**
 * // TODO: add docs
 * 
 * - sorted
 * - paginated
 * - filterable
 */
router.get('/',
           isAuthorized(PERMS.SUPPLIER_READ),
           async function(req, res) {
    let {
        page = 1, 
        limit = 10, 
        inc = ['name', 'address', 'telephone', 'fax', 'additionalInfo']
    } = req.query;

    // Convert `inc` to array if only a single field is specified
    if (!Array.isArray(inc)) {
        inc = [inc];
    }

    try {
        const options = {
            limit: Number(limit), 
            skip: (Number(page) - 1) * Number(limit),
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