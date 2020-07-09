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

    /**
     * ----------------
     * GET (Collection)
     * ----------------
     */
    it(`GET /: User with CUSTOMER_READ perm should be able
        to access the endpoint and retrieve customer
        data with default query fields, no filter and
        default pagination`, async (done) => {
        await authenticatedAdminAgent
                .get(customerEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.customers[0].name).toBeTruthy();
                    expect(res.body.customers[0].address).toBeTruthy();
                    expect(res.body.customers[0].telephone).toBeTruthy();
                    expect(res.body.customers[0].fax).toBeTruthy();
                    expect(res.body.customers[0].email).toBeTruthy();
                    expect(res.body.customers[0].pointOfContact).toBeTruthy();
                    expect(res.body.customers[0].additionalInfo).toBeTruthy();
                    expect(res.body.totalPages).toBe(Math.ceil(testCustomers.length / CONFIG.DEFAULT_PAGE_LIMIT));
                    expect(res.body.currentPage).toBe(1);
                })
        
        done();
    })

    it(`GET /: User with CUSTOMER_READ perm should be able
        to access and the endpoint and retrieve customer
        data with custom query fields`, async (done) => {
        // Positive inclusion
        let query = queryString.stringify({inc: ['name', 'address']});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    // Total number of results should still be the same
                    expect(res.body.customers.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);

                    // Fields included in response should be customised
                    expect(res.body.customers[0].name).toBeTruthy();
                    expect(res.body.customers[0].address).toBeTruthy();
                    expect(res.body.customers[0].telephone).not.toBeTruthy();
                    expect(res.body.customers[0].fax).not.toBeTruthy();
                    expect(res.body.customers[0].email).not.toBeTruthy();
                    expect(res.body.customers[0].pointOfContact).not.toBeTruthy();
                    expect(res.body.customers[0].additionalInfo).not.toBeTruthy();
                })

        // Negative inclusion (include everything except ____)
        query = queryString.stringify({inc: '-description'});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    for (let customer of res.body.customers) {
                        expect(customer.description).not.toBeTruthy();
                    }
                })
        done();
    })

    it(`GET /: User with CUSTOMER_READ perm should be able
        to access and the endpoint and retrieve customer
        data with custom pagination`, async (done) => {
        // First Page
        let query = queryString.stringify({page: 1, limit: testCustomers.length-1});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(testCustomers.length-1);
                    expect(res.body.totalPages).toBe(2);
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({page: 2, limit: testCustomers.length-1});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(1);
                    expect(res.body.totalPages).toBe(2);
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /: User with CUSTOMER_READ perm should be able
        to paginate the request, but response should have no
        customers data if page exceeds total number of pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(0);
                    expect(res.body.totalPages).toBe(Math.ceil(testCustomers.length / 20));
                    expect(res.body.currentPage).toBe(10);
                })
        
        done();
    })

    it(`GET /: User with CUSTOMER_READ perm should be able
        to access the endpoint and retrieve customers
        data with custom sorting`, async (done) => {
        let sortKey = 'name';
        // Performs an ascending sort
        let sortedCustomers = testCustomers.concat().sort(function(i, j) {
            if (i[sortKey] < j[sortKey]) return -1;
            if (i[sortKey] > j[sortKey]) return 1;
            return 0;
        })
        
        // Ascending Sort
        let query = queryString.stringify({sort: sortKey});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(testCustomers.length);
                    expect(res.body.customers[0][sortKey]).toBe(sortedCustomers[0][sortKey]);
                    expect(res.body.customers[res.body.customers.length-1][sortKey]).toBe(sortedCustomers[sortedCustomers.length-1][sortKey]);
                })
        
        // Descending Sort
        query = queryString.stringify({sort: `-${sortKey}`});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(testCustomers.length);
                    expect(res.body.customers[0][sortKey]).toBe(sortedCustomers[sortedCustomers.length-1][sortKey]);
                    expect(res.body.customers[res.body.customers.length-1][sortKey]).toBe(sortedCustomers[0][sortKey]);
                })
        done();
    })

    it(`GET /: User with CUSTOMER_READ perm should be able
        to access the endpoint and retrieve customers
        data with custom filters`, async (done) => {
        // Single Filter (simple Mongoose syntax)
        let filter = {"pointOfContact": testCustomers[0].pointOfContact};
        let query = queryString.stringify({
            filter: JSON.stringify(filter)
        })
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(1);
                })
        
        // Single Filter (complex Mongoose syntax)
        filter = {"$or": [{"pointOfContact": testCustomers[0].pointOfContact }, {"name": testCustomers[1].name}]};
        query = queryString.stringify({
            filter: JSON.stringify(filter)
        })
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(2);
                })

        // Multiple Filters combined into 1
        filter = {"address":{"$regex":"road$","$options":"i"},"pointOfContact":{"$regex":"Santiago","$options":"i"}};
        query = queryString.stringify({
            filter: JSON.stringify(filter)
        })
        await authenticatedAdminAgent
                .get(`${customerEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(1);
                })
        done();
    })

    it(`GET /: User without CUSTOMER_READ perm should not be
        able to access the endpoint and retrieve customers
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(customerEndpoint)
                .expect(403)
        
        done();
    })
})