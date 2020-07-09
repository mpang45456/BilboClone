const request = require('supertest');
const app = require('../../app');
const { CustomerModel, SupplierModel } = require('../../data/database');
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

    let customerObjID = null;
    let newCustomer = {
        name: "New Customer Company",
        address: "Blk 123 Woodlands Industrial Boulevard",
        telephone: "+65 68210213",
        fax: "+65 62410382",
        email: "newCustomerInfo@newCustomerCompany.com",
        pointOfContact: "Mr. Terry Jeffords",
        additionalInfo: "Some Additional Information Here!"
    }

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

        // Obtain customerObjID
        let customerObj = await CustomerModel.findOne({});
        customerObjID = customerObj.id;

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

    /**
     * -------------------------------------
     * GET /:customerObjID (Individual Resource)
     * -------------------------------------
     */
    it(`GET /:customerObjID: User with CUSTOMER_READ perm should
        be able to access the endpoint and retrieve customer
        data with default query fields`, async (done) => {
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBeTruthy();
                    expect(res.body.address).toBeTruthy();
                    expect(res.body.telephone).toBeTruthy();
                    expect(res.body.fax).toBeTruthy();
                    expect(res.body.email).toBeTruthy();
                    expect(res.body.pointOfContact).toBeTruthy();
                    expect(res.body.additionalInfo).toBeTruthy();
                })

        done();
    })

    it(`GET /:customerObjID: User with CUSTOMER_READ perm should
        be able to access the endpoint and retrieve customer
        data with custom query fields`, async (done) => {
        // Include `name` and `address` fields
        let query = queryString.stringify({ inc: ['name', 'address']});
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBeTruthy();
                    expect(res.body.address).toBeTruthy();
                    expect(res.body.telephone).not.toBeTruthy();
                    expect(res.body.fax).not.toBeTruthy();
                    expect(res.body.email).not.toBeTruthy();
                    expect(res.body.pointOfContact).not.toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                })

        // Include `pointOfContact` field only
        query = queryString.stringify({ inc: 'pointOfContact'})
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).not.toBeTruthy();
                    expect(res.body.address).not.toBeTruthy();
                    expect(res.body.telephone).not.toBeTruthy();
                    expect(res.body.fax).not.toBeTruthy();
                    expect(res.body.email).not.toBeTruthy();
                    expect(res.body.pointOfContact).toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                })

        done();
    })

    it(`GET /:customerObjID: User with CUSTOMER_READ perm should
        not be able to access an invalid customerObjID`, async (done) => {
        // Invalid ObjID (valid for another collection)
        const supplierDoc = await SupplierModel.findOne({});
        const supplierObjID = supplierDoc.id;
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${supplierObjID}`)
                .expect(400)

        // Invalid ObjID (wrong format)
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${12312313123}`)
                .expect(400)

        done();
    })

    it(`GET /:customerObjID: User without CUSTOMER_READ perm should
        not be able to access the endpoint and retrieve
        customer data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(`${customerEndpoint}/${customerObjID}`)
                .expect(403)
        
        done();
    })

    /**
     * ----------------------------
     * POST (Create a New Customer)
     * ----------------------------
     */
    it(`POST /: User with CUSTOMER_WRITE perm should be able to
        access the endpoint and create a new customer`, async (done) => {
        let newCustomerObjID = null;
        await authenticatedAdminAgent
                .post(customerEndpoint)
                .send(newCustomer)
                .expect(200)
                .then(res => {
                    newCustomerObjID = res.body._id;
                })

        // Should be able to view new customer (individually)
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${newCustomerObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBe(newCustomer.name);
                    expect(res.body.address).toBe(newCustomer.address);
                    expect(res.body.telephone).toBe(newCustomer.telephone);
                    expect(res.body.fax).toBe(newCustomer.fax);
                    expect(res.body.email).toBe(newCustomer.email);
                    expect(res.body.pointOfContact).toBe(newCustomer.pointOfContact);
                    expect(res.body.additionalInfo).toBe(newCustomer.additionalInfo);
                })

        // Should be able to view new customer (in collection) 
        await authenticatedAdminAgent
                .get(customerEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(testCustomers.length + 1);
                })
        
        done();
    })

    it(`POST /: User with CUSTOMER_WRITE perm should not be 
        able to create a new customer if the required fields are
        missing`, async (done) => {
        // `name` missing
        let newCustomerWithoutName = JSON.parse(JSON.stringify(newCustomer));
        delete newCustomerWithoutName.name;
        await authenticatedAdminAgent
                .post(customerEndpoint)
                .send(newCustomerWithoutName)
                .expect(400)

        // `pointOfContact` missing
        let newCustomerWithoutPointOfContact = JSON.parse(JSON.stringify(newCustomer));
        delete newCustomerWithoutPointOfContact.pointOfContact;
        await authenticatedAdminAgent
                .post(customerEndpoint)
                .send(newCustomerWithoutPointOfContact)
                .expect(400)

        done();
    })

    it(`POST /: User without CUSTOMER_WRITE perm should not
        be able to access the endpoint and create a new
        customer`, async (done) => {
        // With CUSTOMER_READ perm
        await authenticatedReadAgent
                .post(customerEndpoint)
                .send(newCustomer)
                .expect(403);

        // With neither CUSTOMER_READ nor CUSTOMER_WRITE perm
        await authenticatedUnauthorizedAgent
                .post(customerEndpoint)
                .send(newCustomer)
                .expect(403);

        done();
    })

    /**
     * -------------------------
     * PATCH (Update a Customer)
     * -------------------------
     */
    it(`PATCH /:customerObjID: User with CUSTOMER_WRITE perm 
        should be able to access the endpoint and update 
        customer details`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${customerEndpoint}/${customerObjID}`)
                .send({
                    name: newCustomer.name
                })
                .expect(200)

        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toBeTruthy();
                    expect(res.body.name).toBe(newCustomer.name);
                })

        done();
    })

    it(`PATCH /:customerObjID: User with CUSTOMER_WRITE perm 
        should be able to access the endpoint but should not
        be able to update customer details with fields that
        are not customer of the CustomerSchema`, async (done) => {
        await authenticatedAdminAgent
            .patch(`${customerEndpoint}/${customerObjID}`)
            .send({
                name: newCustomer.name,
                nonExistentField: 'nonExistentFieldValue'
            })
            .expect(200)
        
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBe(newCustomer.name);
                    expect(res.body.nonExistentField).not.toBeTruthy();
                })

        done();
    })

    it(`PATCH /:customerObjID: User without CUSTOMER_WRITE perm
        should not be able to access the endpoint and update
        customer details`, async (done) => {
        // With CUSTOMER_READ perm
        await authenticatedReadAgent
                .patch(`${customerEndpoint}/${customerObjID}`)
                .send({
                    name: newCustomer.name
                })
                .expect(403);

        // With neither CUSTOMER_READ nor CUSTOMER_WRITE perm
        await authenticatedUnauthorizedAgent
                .patch(`${customerEndpoint}/${customerObjID}`)
                .send({
                    name: newCustomer.name
                })
                .expect(403);

        done();
    })

    /**
     * -------------------------------
     * DELETE (An Individual Customer)
     * -------------------------------
     */
    it(`DELETE /:customerObjID: User with CUSTOMER_WRITE perm
        should be able to access the endpoint and delete
        a customer. Customer should not longer be accessible via
        the PART API`, async (done) => {
        await authenticatedAdminAgent
                .delete(`${customerEndpoint}/${customerObjID}`)
                .expect(200)

        // Unable to retrieve individual customer details
        await authenticatedAdminAgent
                .get(`${customerEndpoint}/${customerObjID}`)
                .expect(400)

        // Unable to retrieve deleted customer's details in collection
        await authenticatedAdminAgent
                .get(customerEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.customers.length).toBe(testCustomers.length - 1);
                })

        done();
    })

    it(`DELETE /:customerObjID: User with CUSTOMER_WRITE perm
        deleting a non-existent customer should still result
        in a 200 status code response`, async (done) => {
        const supplierDoc = await SupplierModel.findOne({});
        const supplierObjID = supplierDoc.id;
        await authenticatedAdminAgent
            .delete(`${customerEndpoint}/${supplierObjID}`)
            .expect(200)

        // Nothing should have been deleted
        await authenticatedAdminAgent
            .get(customerEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.customers.length).toBe(testCustomers.length);
            })
        done();
    })

    it(`DELETE /:customerObjID: User with CUSTOMER_WRITE perm
        deleting an already-deleted customer should still result
        in a 200 status code response`, async (done) => {
        // Delete existing customer
        await authenticatedAdminAgent
            .delete(`${customerEndpoint}/${customerObjID}`)
            .expect(200)

        // Customer should have been deleted
        await authenticatedAdminAgent
            .get(customerEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.customers.length).toBe(testCustomers.length - 1);
            })
        
        // Delete already-deleted customer
        await authenticatedAdminAgent
            .delete(`${customerEndpoint}/${customerObjID}`)
            .expect(200)
        
        // No other customers should have been deleted
        await authenticatedAdminAgent
            .get(customerEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.customers.length).toBe(testCustomers.length - 1);
            })
        
        done();
    })

    it(`DELETE /:customerObjID: User without CUSTOMER_WRITE perm
        should not be able to access the endpoint and delete
        a customer`, async (done) => {
        // With CUSTOMER_READ perm
        await authenticatedReadAgent
                .delete(`${customerEndpoint}/${customerObjID}`)
                .expect(403);

        // With neither CUSTOMER_READ nor CUSTOMER_WRITE perm
        await authenticatedUnauthorizedAgent
                .delete(`${customerEndpoint}/${customerObjID}`)
                .expect(403);

        done();
    })

})