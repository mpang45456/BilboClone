const request = require('supertest');
const app = require('../../app');
const { SupplierModel, PartModel } = require('../../data/database');
const queryString = require('query-string');

let testSuppliersWithParts = require('../../data/databaseBootstrap').suppliers;
let testUsers = require('../../data/databaseBootstrap').users;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { partEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe('Testing /api/v1/part endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null; // PART_READ, PART_WRITE
    let authenticatedReadAgent = null; // PART_READ
    let authenticatedUnauthorizedAgent = null; // No access to PART API

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

        // Seed Database
        await dbi.addSuppliersAndParts(...testSuppliersWithParts);

        // Login
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
        const readUser = testUsers[3];
        authenticatedReadAgent = await getAuthenticatedAgent(server, readUser.username, readUser.password);
        const unauthorizedUser = testUsers[1];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, unauthorizedUser.username, unauthorizedUser.password);

        done();
    })

    it(`testing...`, async (done) => {
        let test = `
            unauthenticated users should not be able to access the Supplier API
        `
        done();
    })

    
})