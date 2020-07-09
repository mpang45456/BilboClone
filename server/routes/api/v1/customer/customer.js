const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { CustomerModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);

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