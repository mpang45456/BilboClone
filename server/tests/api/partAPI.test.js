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
    let allTestParts = [];

    beforeAll(async (done) => {
        dbi = new DatabaseInteractor();
        await dbi.initConnection(true);

        for (let testSupplier of testSuppliersWithParts) {
            allTestParts = allTestParts.concat(testSupplier.parts);
        }

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

    /**
     * ----------------
     * GET (Collection)
     * ----------------
     */
    it(`GET /: User with PART_READ perm should be able
        to access and the endpoint and retrieve parts
        data with default query fields, no filter and
        default pagination`, async (done) => {
        await authenticatedAdminAgent
                .get(partEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.length).toBe(allTestParts.length);
                    expect(res.body[0].supplier).toBeTruthy();
                    expect(res.body[0].partNumber).toBeTruthy();
                    expect(res.body[0].priceHistory).toBeTruthy();
                    expect(res.body[0].description).toBeTruthy();
                    expect(res.body[0].status).toBeTruthy();
                    expect(res.body[0].additionalInfo).toBeTruthy();
                })
        
        done();
    })

    it(`GET /: User with PART_READ perm should be able
        to access and the endpoint and retrieve parts
        data with custom query fields`, async (done) => {
        // Positive inclusion
        let query = queryString.stringify({inc: ['supplier', 'partNumber']});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    // Total number of results should still be the same
                    expect(res.body.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.length).toBe(allTestParts.length);

                    // Fields included in response should be customised
                    expect(res.body[0].supplier).toBeTruthy();
                    expect(res.body[0].partNumber).toBeTruthy();
                    expect(res.body[0].priceHistory).not.toBeTruthy();
                    expect(res.body[0].description).not.toBeTruthy();
                    expect(res.body[0].status).not.toBeTruthy();
                    expect(res.body[0].additionalInfo).not.toBeTruthy();
                })

        // Negative inclusion (include everything except ____)
        query = queryString.stringify({inc: '-description'});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    for (let part of res.body) {
                        expect(part.description).not.toBeTruthy();
                    }
                })
        done();
    })

    it(`GET /: User with PART_READ perm should be able
        to access and the endpoint and retrieve parts
        data with custom pagination`, async (done) => {
        // First Page
        let query = queryString.stringify({page: 1, limit: allTestParts.length-1});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(allTestParts.length-1);
                })
        
        // Second Page
        query = queryString.stringify({page: 2, limit: allTestParts.length-1});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(1);
                })
        done();
    })

    it(`GET /: User with PART_READ perm should be able
        to access and the endpoint and retrieve parts
        data with custom sorting`, async (done) => {
        let sortKey = 'partNumber';
        // Performs an ascending sort
        let sortedParts = allTestParts.concat().sort(function(i, j) {
            if (i[sortKey] < j[sortKey]) return -1;
            if (i[sortKey] > j[sortKey]) return 1;
            return 0;
        })
        
        // Ascending Sort
        let query = queryString.stringify({sort: 'partNumber'});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(allTestParts.length);
                    expect(res.body[0].partNumber).toBe(sortedParts[0].partNumber);
                    expect(res.body[res.body.length-1].partNumber).toBe(sortedParts[sortedParts.length-1].partNumber);
                })
        
        // Descending Sort
        query = queryString.stringify({sort: '-partNumber'});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(allTestParts.length);
                    expect(res.body[0].partNumber).toBe(sortedParts[sortedParts.length-1].partNumber);
                    expect(res.body[res.body.length-1].partNumber).toBe(sortedParts[0].partNumber);
                })
        done();
    })

    it(`GET /: User with PART_READ perm should be able
        to access and the endpoint and retrieve parts
        data with custom filters`, async (done) => {
        let filter = {"priceHistory.unitPrice": 0.040};
        await authenticatedAdminAgent
                .get(partEndpoint)
                .send(filter)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(2);
                })
        
        filter = {"$or": [{"description": "RFID receiver"}, {"description": "RFID transmitter"}]};
        await authenticatedAdminAgent
                .get(partEndpoint)
                .send(filter)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(2);
                })
        done();
    })

    it(`GET /: User without PART_READ perm should not be
        able to access the endpoint and retrieve parts
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(partEndpoint)
                .expect(403)
        
        done();
    })

    it(`testing...`, async (done) => {
        let test = `
            unauthenticated users should not be able to access the Supplier API
        `
        done();
    })

    
})