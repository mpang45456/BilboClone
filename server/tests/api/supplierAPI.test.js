const request = require('supertest');
const app = require('../../app');
const { SupplierModel, PartModel } = require('../../data/database');
// const { expect } = require('chai');

let testSuppliersWithParts = require('../../data/databaseBootstrap').suppliers;
const { PERMS } = require('../../routes/api/v1/auth/permissions');
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { loginEndpoint, 
        supplierEndpoint,
        getAuthenticatedAgent } = require('./testUtils');

describe('Testing /api/v1/supplier endpoint', () => {
    let dbi = null;
    let authenticatedAdminAgent = null; // SUPPLIER_READ, SUPPLIER_WRITE
    let authenticatedReadAgent = null; // SUPPLIER_READ
    let authenticatedUnauthorizedAgent = null; // No access to SUPPLIER API

    beforeAll(async (done) => {
        dbi = new DatabaseInteractor();
        await dbi.initConnection(true);

        const serverPortNumber = process.env.PORT;
        server = app.listen(serverPortNumber, function() {
            done();
        })
    })

    afterAll((done) => {
        // Close server after all tests
        server && server.close(done);
    })

    beforeEach(async (done) => {
        // Reset Database
        await dbi.clearModelData(SupplierModel);
        await dbi.clearModelData(PartModel);

        // Login
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
        const readUser = testsUsers[3];
        authenticatedReadAgent = await getAuthenticatedAgent(server, readUser.username, readUser.password);
        const unauthorizedUser = testsUsers[1];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, unauthorizedUser.username, unauthorizedUser.password);

        done();
    })


})