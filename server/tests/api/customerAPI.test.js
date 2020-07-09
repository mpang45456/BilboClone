const request = require('supertest');
const app = require('../../app');
const { CustomerModel } = require('../../data/database');
const queryString = require('query-string');

let testCustomers = require('../../data/databaseBootstrap').customers;
let testUsers = require('../../data/databaseBootstrap').users;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { customerEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe('Testing /api/v1/customer endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null;         // CUSTOMER_READ, CUSTOMER_WRITE
    let authenticatedReadAgent = null;          // CUSTOMER_READ
    let authenticatedUnauthorizedAgent = null;  // No access to CUSTOMER API

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
        await dbi.clearModelData(CustomerModel);

        // Seed Database
        await dbi.addCustomers(...testCustomers);

        // Login
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
        const readUser = testUsers[3];
        authenticatedReadAgent = await getAuthenticatedAgent(server, readUser.username, readUser.password);
        const unauthorizedUser = testUsers[1];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, unauthorizedUser.username, unauthorizedUser.password);

        done();
    })
})