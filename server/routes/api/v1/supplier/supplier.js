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
    // TODO: Add filtering
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

/**
 * Mounted on /api/v1/supplier
 * 
 * Creates a new supplier, using the fields provided
 * in the request (JSON)
 * 
 * Note: only `username` is a compulsory field that
 * must be provided in the request.
 * 
 * Note: even if `parts` information is provided in the
 * request, the data will not be persisted. To persist,
 * parts data, use the PARTS API instead.
 */
router.post('/', 
            isAuthorized(PERMS.SUPPLIER_WRITE),
            async function(req, res) {
    const { name, address, telephone, fax, additionalInfo } = req.body;
    try {
        const newSupplier = new SupplierModel({ name, 
                                                address, 
                                                telephone, 
                                                fax,
                                                additionalInfo });
        await newSupplier.save();
        return res.status(200).send(`Successfully created new supplier: ${newSupplier}`);
    } catch(err) {
        logger.error(`POST /supplier: Could not create new supplier: ${err}`);
        return res.status(400).send('Unable to create new supplier');
    }
})

/**
 * Mounted on /api/v1/supplier/:supplierObjID
 * 
 * Updates the fields of the supplier document,
 * as identified by `:supplierObjID`.
 * 
 * Note: Even the name of the supplier can be
 * changed, as the relationship between parts and
 * suppliers is by ObjectID, not by supplier name
 * 
 * Note: The `parts` data associated with the 
 * supplier cannot be modified here. Use the PARTS
 * API for that.
 */
router.patch('/:supplierObjID',
             isAuthorized(PERMS.SUPPLIER_WRITE),
             async function(req, res) {
    const { name, address, telephone, fax, additionalInfo } = req.body;
    try {
        const supplierDoc = await SupplierModel.findOne({ _id: req.params.supplierObjID});
        if (name) { supplierDoc.name = name; }
        if (address) { supplierDoc.address = address; }
        if (telephone) { supplierDoc.telephone = telephone; }
        if (fax) { supplierDoc.fax = fax; }
        if (additionalInfo) { supplierDoc.additionalInfo = additionalInfo; }
        await supplierDoc.save();
        return res.status(200).send('Successfully updated supplier');
    } catch(err) {
        logger.error(`PATCH /supplier: Could not patch supplier: ${err}`);
        return res.status(400).send('Unable to patch supplier information');
    }
})

/**
 * Mounted on /api/v1/supplier/:supplierObjID
 * 
 * Deletes the supplier document identified by
 * `:supplierObjID`. 
 * 
 * Note: Providing an invalid `:supplierObjID`
 * will still result in a 200 status code response.
 * This is because the end result of the request
 * is still the same (the supplier document with
 * the `:supplierObjID` is not longer in the database)
 * 
 * Note: This method will also delete all the 
 * parts associated with the supplier.
 */
router.delete('/:supplierObjID', 
              isAuthorized(PERMS.SUPPLIER_WRITE),
              async function(req, res) {
    try {
        await SupplierModel.deleteOne({ _id: req.params.supplierObjID });
        await PartModel.deleteMany({ supplier: req.params.supplierObjID });
        return res.status(200).send('Deleted supplier');
    } catch(err) {
        return res.status(400).send('Unable to delete supplier');
    }
})

module.exports = {
    supplierRouter: router,
}