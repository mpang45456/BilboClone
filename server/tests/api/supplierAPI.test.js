const request = require('supertest');
const app = require('../../app');
const { SupplierModel, PartModel } = require('../../data/database');
// const { expect } = require('chai'); // TODO: Marked for removal
const queryString = require('query-string');

let testSuppliersWithParts = require('../../data/databaseBootstrap').suppliers;
let testUsers = require('../../data/databaseBootstrap').users;
const { PERMS } = require('../../routes/api/v1/auth/permissions');
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { loginEndpoint, 
        supplierEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe.only('Testing /api/v1/supplier endpoint', () => {
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

    it(`GET: User with SUPPLIER_READ perm should be able
        to access the endpoint and retrieve the supplier
        data with default query fields`, async (done) => {
        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body[0].name).toBeTruthy();
                    expect(res.body[0].address).toBeTruthy();
                    expect(res.body[0].telephone).toBeTruthy();
                    expect(res.body[0].fax).toBeTruthy();
                    expect(res.body[0].additionalInfo).toBeTruthy();
                })
        done();
    })

    it(`GET: User with SUPPLIER_READ perm should be able
        to specify which fields to include in query`, async (done) => {
        // `name` and `telephone` are to be included in response
        let query = queryString.stringify({ inc: ['name', 'telephone']});
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body[0].name).toBeTruthy();
                    expect(res.body[0].address).not.toBeTruthy();
                    expect(res.body[0].telephone).toBeTruthy();
                    expect(res.body[0].fax).not.toBeTruthy();
                    expect(res.body[0].additionalInfo).not.toBeTruthy();
                })
        done();
    })

    it(`GET: User with SUPPLIER_READ perm should be able
        to paginate the request`, async (done) => {
        // First Page
        let query = queryString.stringify({ page: 1, limit: 2});
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(2);
                    expect(res.body[0].name).toBe(testSuppliersWithParts[0].name);
                    expect(res.body[1].name).toBe(testSuppliersWithParts[1].name);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(2);
                    expect(res.body[0].name).toBe(testSuppliersWithParts[2].name);
                    expect(res.body[1].name).toBe(testSuppliersWithParts[3].name);
                })
        done();
    })

    it(`GET: User with SUPPLIER_READ perm should be able
        to sort the request`, async (done) => {
        // Sort by descending order for `name` field
        let query = queryString.stringify({ sort: '-name' });
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSuppliersWithParts.length);
                    expect(res.body[0].name).toBe(testSuppliersWithParts[3].name);
                    expect(res.body[1].name).toBe(testSuppliersWithParts[2].name);
                    expect(res.body[2].name).toBe(testSuppliersWithParts[1].name);
                    expect(res.body[3].name).toBe(testSuppliersWithParts[0].name);
                })
        done();
    })

    it(`GET: User without SUPPLIER_READ perm should not be
        able to access the endpoint and retrieve supplier
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(supplierEndpoint)
                .expect(403);
        done();
    })



    it('more tests', (done) => {
        let tests = `
        unauthenticated users should not be able to access the API (test all HTTP verbs)
        unauthorized users should not be able to access the API (different authorization for the specific HTTP verbs)
        
        `
        done();
    })


})