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

/**
 * Mounted on /api/v1/part/:partObjID
 * 
 * Gets part information on the part identified
 * by `:partObjID`
 * 
 * Request query string can specify:
 * 1. Fields to include (`inc`)
 * 
 * Note: The `supplier` path will not be populated,
 * even if `supplier` is included. Only the ObjectID
 * will be returned in the response (if included)
 * 
 * Note: Will return 400 status code is the 
 * `partObjID` is invalid
 */
router.get('/:partObjID',
           isAuthorized(PERMS.PART_READ),
           async function(req, res) {
    let {
        inc = ['supplier', 'partNumber', 'priceHistory', 'description', 'status', 'additionalInfo'],
    } = req.query;

    // Convert `inc`/`sort` to array if only a single field is specified
    if (!Array.isArray(inc)) { inc = [inc]; }

    try {
        let part = await PartModel.findOne({ _id: req.params.partObjID}, inc.join(' '));
        if (!part) {
            return res.status(400).send('Invalid part ID');
        }
        return res.status(200).json(part);
    } catch(err) {
        logger.error(`GET /part/:partObjID: Could not get part: ${err}`);
        return res.sendStatus(500);
    }
})

/**
 * Mounted at /api/v1/part
 * 
 * Create a new part. 
 * 
 * Note: The initial `unitPrice` and `additionalInfo` 
 * for the initial price is optional. If it is included,
 * then it will form the first price in the `priceHistory`
 * 
 * Note: When a new part is created, the supplier 
 * document associated with the part is also updated
 * to include the new part.
 * 
 * Note: If the request is successful, the response will
 * send the newly-created part back as JSON in the body.
 */
router.post('/', 
            isAuthorized(PERMS.PART_WRITE),
            async function(req, res) {
    const { supplierObjID, 
            partNumber, 
            unitPrice, 
            priceAdditionalInfo, 
            description, 
            status, 
            additionalInfo } = req.body;
    
    try {
        // Create New Part
        const newPart = new PartModel({ supplier: supplierObjID, 
                                        partNumber, 
                                        description, 
                                        status,
                                        additionalInfo });
        if (unitPrice) {
            newPart.priceHistory.push({ createdBy: req.user.username, // set by `isAuthenticated` middleware
                                        unitPrice, 
                                        additionalInfo: priceAdditionalInfo });
        }
        await newPart.save();

        // Update Supplier with New Part
        const supplier = await SupplierModel.findOne({ _id: supplierObjID });
        supplier.parts.push(newPart._id);
        await supplier.save();

        return res.status(200).json(newPart);
    } catch(err) {
        logger.error(`POST /part: Could not create new part: ${err}`);
        return res.status(400).send('Unable to create new part');
    }
})

/**
 * Mounted on /api/v1/part/:partObjID
 * 
 * Updates the details of the part identified
 * by `:partObjID`
 * 
 * Note: The supplier field in the part cannot
 * be changed. If a change is required, delete 
 * the part and make a new one with the required
 * changes. 
 * 
 * Note: All fields (except `priceHistory` and
 * `supplier`) are updated in place. 
 * 
 * Note: Changes to `priceHistory` are appended,
 * not updated in-place
 * 
 * Note: Change of status from 'ACTIVE' to 'ARCHIVED'
 * and vice versa should be done here.
 */
router.patch('/:partObjID',
             isAuthorized(PERMS.PART_WRITE),
             async function(req, res) {
    const { partNumber, 
            unitPrice, 
            priceAdditionalInfo, 
            description, 
            status, 
            additionalInfo} = req.body;

    try {
        const part = await PartModel.findOne({ _id: req.params.partObjID });
        if (partNumber) { part.partNumber = partNumber; }
        if (description) { part.description = description; }
        if (status) { part.status = status; }
        if (additionalInfo) { part.additionalInfo = additionalInfo; }
        if (unitPrice || priceAdditionalInfo) {
            part.priceHistory.push({
                createdBy: req.user.username, // set by `isAuthenticated` middleware
                unitPrice: unitPrice, 
                additionalInfo: priceAdditionalInfo
            })
        }
        await part.save();
        return res.status(200).send('Successfully updated part');
    } catch(err) {
        logger.error(`PATCH /part: Could not update part: ${err}`);
        return res.status(400).send('Unable to update part');
    }
})

// have to update supplier as well
// does not do idempotent delete ??
router.delete('/:partObjID',
              isAuthorized(PERMS.PART_WRITE),
              async function(req, res) {
    try {
        // const partObj = await PartModel.findOne({ _id: req.params.partObjID });
        await SupplierModel.findOneAndUpdate({ parts: req.params.partObjID }, { $pull: {parts: req.params.partObjID }});
        await PartModel.deleteOne({ _id: req.params.partObjID });
        return res.status(200).send('Deleted part');
    } catch(err) {
        return res.status(400).send('Unable to delete part');
    }
})

module.exports = {
    partRouter: router
}