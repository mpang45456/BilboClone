const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { SupplierModel, PartModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');
const CONFIG = require('../../../../config');

// Router Set-Up
router.use(isAuthenticated);


// FIXME: Testing
router.get('/', function(req, res) {
    res.send("HELLO WORLD");
})

module.exports = {
    partRouter: router
}