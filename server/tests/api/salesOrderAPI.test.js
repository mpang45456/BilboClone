const request = require('supertest');
const app = require('../../app');
const { SupplierModel, 
        PartModel, 
        CounterModel,
        SalesOrderModel, 
        SalesOrderStateModel, 
        PurchaseOrderModel, 
        PurchaseOrderStateModel } = require('../../data/database');
const queryString = require('query-string');

const { SO_STATES, PO_STATES } = require('../../data/databaseEnum');
const testSalesOrders = require('../../data/databaseBootstrap').salesOrders;
const testPurchaseOrders = require('../../data/databaseBootstrap').purchaseOrders;
const testUsers = require('../../data/databaseBootstrap').users;
const testCustomers = require('../../data/databaseBootstrap').customers;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { salesOrderEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

/**
 * Note: This API uses the user hierarchy. Hence, the tester
 * must take note of the user hierarchy when writing assertions.
 */
describe('Testing /api/v1/salesOrder endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null;         // SALES_ORDER_READ, SALES_ORDER_WRITE, SALES_ORDER_<STATUS>_READ/WRITE
    let authenticatedReadAgent = null;          // SALES_ORDER_READ
    let authenticatedUnauthorizedAgent = null;  // No access to SALES_ORDER API
    // TODO: Add SALES_ORDER_<STATUS>_READ/WRITE Perms

    let salesOrderObjID = null;

    const newSalesOrderMetaData = {
        customerName: testCustomers[1].name, 
        additionalInfo: 'API TEST: New Sales Order Meta-Data',
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
        await dbi.clearModelData(CounterModel);
        await dbi.clearModelData(SalesOrderModel);
        await dbi.clearModelData(SalesOrderStateModel);
        await dbi.clearModelData(PurchaseOrderModel);
        await dbi.clearModelData(PurchaseOrderStateModel);

        // Seed Database
        await dbi.__initCounters();
        await dbi.addSalesOrders(...testSalesOrders);
        await dbi.addPurchaseOrders(...testPurchaseOrders);

        // Obtain SalesOrderObjID
        const salesOrderDoc = await SalesOrderModel.findOne({ createdBy: testUsers[3].username });
        salesOrderObjID = salesOrderDoc._id; // readable by `authenticatedReadAgent`

        // Login
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
        const readUser = testUsers[3];
        authenticatedReadAgent = await getAuthenticatedAgent(server, readUser.username, readUser.password);
        const unauthorizedUser = testUsers[2];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, unauthorizedUser.username, unauthorizedUser.password);

        done();
    })

    /**
     * ---------------------------------------
     * GET (Sales Order Meta-Data: collection)
     * ---------------------------------------
     * 
     * Note: authenticatedReadAgent has 2 sales
     * orders (testSalesOrders[0] and testSalesOrders[2]),
     * although there are 3 sales orders in total
     * available in the test. This is due to the
     * user hierarchy.
     */
    it(`GET /: User with SALES_ORDER_READ perm should be able
        to access the collection endpoint and retrieve the sales
        order meta-data with default query fields`, async (done) => {
        await authenticatedReadAgent
                .get(salesOrderEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.salesOrders[0].createdBy).toBeTruthy();
                    expect(res.body.salesOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.salesOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.salesOrders[0].customer).toBeTruthy();
                    expect(res.body.salesOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.salesOrders[0].orders).toBeTruthy();
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should be able
        to specify which fields to include in query when retrieving
        sales order meta-data`, async (done) => {
        // Inclusion
        let query = queryString.stringify({ inc: ['createdBy', 'orderNumber']});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.salesOrders[0].createdBy).toBeTruthy();
                    expect(res.body.salesOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.salesOrders[0].latestStatus).not.toBeTruthy();
                    expect(res.body.salesOrders[0].customer).toBeTruthy(); // Customer will be included unless explicitly excluded
                    expect(res.body.salesOrders[0].additionalInfo).not.toBeTruthy();
                    expect(res.body.salesOrders[0].orders).not.toBeTruthy();
                })
        
        // Exclusion
        query = queryString.stringify({ inc: ['-createdBy']});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.salesOrders[0].createdBy).not.toBeTruthy();
                    expect(res.body.salesOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.salesOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.salesOrders[0].customer).toBeTruthy(); // Customer will be included unless explicitly excluded
                    expect(res.body.salesOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.salesOrders[0].orders).toBeTruthy();
                })

        // Exclusion (`customer` field)
        query = queryString.stringify({ inc: ['-customer']});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.salesOrders[0].createdBy).toBeTruthy();
                    expect(res.body.salesOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.salesOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.salesOrders[0].customer).not.toBeTruthy(); // Customer will be included unless explicitly excluded
                    expect(res.body.salesOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.salesOrders[0].orders).toBeTruthy();
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should be able
        to retrieve sales order meta-data with custom filters`, async (done) => {
        // Without filters
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(2);
                })
        
        // Filter for sales orders (meta-data) with SO_STATES.CONFIRMED as their 
        // latest status
        let filter = { "latestStatus": SO_STATES.CONFIRMED };
        let query = queryString.stringify({
            filter: JSON.stringify(filter)
        });
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(1);
                })

        // Filter for sales orders (meta-data) whose `additionalInfo` field
        // includes an exclamation mark ('!')
        filter = {"additionalInfo": { "$regex": "!", "$options": "i"}};
        query = queryString.stringify({
            filter: JSON.stringify(filter)
        });
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(1);
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should be able
        to paginate the request`, async (done) => {
        // First Page
        let query = queryString.stringify({ page: 1, limit: 2});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(2);
                    expect(res.body.salesOrders[0].orderNumber).toBe(testSalesOrders[0].orderNumber);
                    expect(res.body.salesOrders[1].orderNumber).toBe(testSalesOrders[2].orderNumber);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should be able
        to paginate the request, but response should have no
        sales order meta-data if page exceeds total number of 
        pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(10);
                })
        
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should be able
        to sort the request`, async (done) => {
        // Sort by descending order for `name` field
        let query = queryString.stringify({ sort: '-orderNumber' });
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(2);
                    expect(res.body.salesOrders[0].orderNumber).toBe(testSalesOrders[2].orderNumber); 
                    expect(res.body.salesOrders[1].orderNumber).toBe(testSalesOrders[0].orderNumber);
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should only be
        able to view sales order meta-data created by users 
        underneath the user in the user hierarchy`, async (done) => {
        const user1Account = await getAuthenticatedAgent(server, testUsers[1].username, testUsers[1].password);
        await user1Account
                .get(salesOrderEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(3);
                })
        
        await authenticatedReadAgent
                .get(salesOrderEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(2);
                })
        done();
    })

    it(`GET /: User with SALES_ORDER_READ perm should only be
        able to view sales order meta-data created by users 
        underneath the user in the user hierarchy, and user should
        not be able to tamper with the user hierarchy.`, async (done) => {
        let filter = { "createdBy": { "$in": ["admin", "user1"] }};
        let query = queryString.stringify({
            filter: JSON.stringify(filter)
        });
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(2);
                    expect(res.body.salesOrders[0].createdBy).toBe(testUsers[3].username);
                    expect(res.body.salesOrders[1].createdBy).toBe(testUsers[3].username);
                })

        done();
    })

    it(`GET /: User without SALES_ORDER_READ perm should not be
        able to access the endpoint and retrieve sales order meta
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(salesOrderEndpoint)
                .expect(403);
        done();
    })

    /**
     * -----------------------------------------
     * POST (Create a New Sales Order Meta-Data)
     * -----------------------------------------
     */
    it(`POST /: User with SALES_ORDER_WRITE perm should
        be able to create a new sales order meta-data`, async (done) => {
        // Create new Sales Order Meta-Data
        await authenticatedAdminAgent
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaData)
                .expect(200)

        // Should be able to retrieve in GET (collection) method
        await authenticatedAdminAgent
                .get(salesOrderEndpoint)
                .expect(200)
                .then(res => {
                    expect(res.body.salesOrders.length).toBe(testSalesOrders.length + 1);
                })
        done();
    })

    it(`POST /: User with SALES_ORDER_WRITE perm should
        not be able to create a new sales order meta data 
        if the customer name field is missing`, async (done) => {
        const newSalesOrderMetaDataWithoutCustomerName = JSON.parse(JSON.stringify(newSalesOrderMetaData));
        delete newSalesOrderMetaDataWithoutCustomerName.customerName;

        await authenticatedAdminAgent
            .post(salesOrderEndpoint)
            .send(newSalesOrderMetaDataWithoutCustomerName)
            .expect(400)
        
        done();
    })

    it(`POST /: User with SALES_ORDER_WRITE perm should
        not be able to specify 'createdBy', 'orderNumber'
        and 'latestStatus' fields when creating a new
        sales order meta-data, even if the values are
        provided in the request`, async (done) => {
        const newSalesOrderMetaDataWithExtraData = JSON.parse(JSON.stringify(newSalesOrderMetaData));
        newSalesOrderMetaData.createdBy = testUsers[3].username;
        newSalesOrderMetaData.latestStatus = SO_STATES.FULFILLED;
        newSalesOrderMetaData.orderNumber = 'SO-INVALID';

        let newSalesOrderObjID = null;
        await authenticatedAdminAgent
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaDataWithExtraData)
                .expect(200)
                .then(res => {
                    newSalesOrderObjID = res.body._id;
                })

        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${newSalesOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.createdBy).not.toBe(newSalesOrderMetaDataWithExtraData.createdBy);
                    expect(res.body.createdBy).toBe(testUsers[0].username);
                    expect(res.body.latestStatus).not.toBe(newSalesOrderMetaDataWithExtraData.latestStatus);
                    expect(res.body.latestStatus).toBe(SO_STATES.NEW);
                    expect(res.body.orderNumber).not.toBe(newSalesOrderMetaDataWithExtraData.orderNumber);
                })
        
        done();
    })

    it(`POST /: User without SALES_ORDER_WRITE perm should
        not be able to create a new sales order meta-data`, async (done) => {
        // Has SALES_ORDER_READ perm
        await authenticatedReadAgent
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaData)
                .expect(403)
        
        // Has neither SALES_ORDER_READ nor SALES_ORDER_WRITE perm
        await authenticatedUnauthorizedAgent
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaData)
                .expect(403)
        
        done();
    })

    it(`These are the things that need to be tested: `, async (done) => {
        const testString = `
        GET sales order meta-data collection: 
            - default query fields
            - use of query strings
            - use of filters
            - exclusion of customer
            - pagination
        `;
        done();
    })


    /**
     * ------------------------------------------------
     * GET (Sales Order Meta-Data: Individual Resource)
     * ------------------------------------------------
     */
    it(`GET /:salesOrderObjID: User with SALES_ORDER_READ perm
        should not be able to access an invalid salesOrderObjID`, async (done) => {
        // Invalid ObjID (valid for another collection)
        const partDoc = await PartModel.findOne({});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}/${partDoc._id}`)
                .expect(400);

        // Invalid ObjID (wrong format)
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}/123`)
                .expect(400);
        done();
    })

    it(`GET /:salesOrderObjID: User without SALES_ORDER_READ perm 
        should not be able to access the endpoint and retrieve
        sales order meta data`, async(done) => {
        await authenticatedUnauthorizedAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}`)
                .expect(403);
        done();
    })

    it(`GET /:salesOrderObjID: User with SALES_ORDER_READ perm
        should only be able to access a sales order meta data
        created by a user under the user in the user hierarchy`, async (done) => {
        // `admin` user creates a sales order meta data object
        let adminCreatedSalesOrderMetaDataObjID = null;
        authenticatedAdminAgent
            .post(salesOrderEndpoint)
            .send(newSalesOrderMetaData)
            .expect(200)
            .then(res => {
                adminCreatedSalesOrderMetaDataObjID = res.body._id;
            })

        // `user4` user creates a sales order meta data object
        let user4CreatedSalesOrderMetaDataObjID = null;
        const user4Account = testUsers[4];
        const authenticatedUser4Agent = await getAuthenticatedAgent(server, 
                                                                    user4Account.username, 
                                                                    user4Account.password);
        authenticatedUser4Agent
            .post(salesOrderEndpoint)
            .send(newSalesOrderMetaData)
            .expect(200)
            .then(res => {
                user4CreatedSalesOrderMetaDataObjID = res.body._id;
            })
    
        // `user1` should only be able to access the sales order
        // meta data object created by `user4` but not `admin`
        const user1Account = testUsers[1];
        const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
                                                                    user1Account.username, 
                                                                    user1Account.password);
        authenticatedUser1Agent
            .get(`${salesOrderEndpoint}/${adminCreatedSalesOrderMetaDataObjID}`)
            .expect(403);
        authenticatedUser1Agent
            .get(`${salesOrderEndpoint}/${user4CreatedSalesOrderMetaDataObjID}`)
            .expect(200)
            .expect(res => {
                expect(res.body.createdBy).toBe(user4Account.username);
                expect(res.body.latestStatus).toBe(SO_STATES.NEW);
                expect(res.body.additionalInfo).toBe(newSalesOrderMetaData.additionalInfo);
                expect(res.body.orderNumber).toBeTruthy();
                expect(res.body.orders).toBeTruthy();
                expect(res.body.customer.name).toBe(newSalesOrderMetaData.customerName);
            })

        done();
    })

    /**
     * -----------------------------------------
     * GET (Sales Order State Data - Collection)
     * -----------------------------------------
     */
    it(`GET /:salesOrderObjID/state: User with SALES_ORDER_READ 
        perm should be able to read sales order meta data with
        default query fields`, async (done) => {
        authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state`)
            .expect(200)
            .expect(res => {
                expect(res.body.length).toBe(2);
                expect(res.body[0].status).toBeTruthy();
                expect(res.body[0].additionalInfo).toBeTruthy();
                expect(res.body[0].parts).toBeTruthy();
                expect(res.body[0].updatedBy).toBeTruthy();
            })
        
        done();
    })

    it(`GET /:salesOrderObjID/state: User with SALES_ORDER_READ 
        perm should be able to read sales order meta data with
        custom query fields`, async (done) => {
        let query = queryString.stringify({ inc: ['status', 'updatedBy', 'updatedAt'] });
        authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state`)
            .expect(200)
            .expect(res => {
                expect(res.body.length).toBe(2);
                expect(res.body[0].status).toBeTruthy();
                expect(res.body[0].additionalInfo).not.toBeTruthy();
                expect(res.body[0].parts).not.toBeTruthy();
                expect(res.body[0].updatedBy).toBeTruthy();
                expect(res.body[0].updatedAt).toBeTruthy();
            })
        
        done();
    })
    
    it(`GET /:salesOrderObjID/state: User with SALES_ORDER_READ 
        perm should only be able to access sales order state data
        if the sales order meta data is created by a user that is
        in the requesting user's user hierarchy`, async (done) => {
        // Created by `user1` (so readable by `admin` but not `user3`)
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000002' });

        // `admin` user account
        authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
            .expect(200)
            .expect(res => {
                expect(res.body.length).toBe(2);
            })

        // `user3` user account
        authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
            .expect(403);
        
        done();
    })

    it(`GET /:salesOrderObjID/state: User without SALES_ORDER_READ 
        perm should not be able to access the endpoint and read
        sales order state data`, async (done) => {
        authenticatedUnauthorizedAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state`)
            .expect(403);

        done();
    })
    
    /**
     * ----------------------------------------------------
     * GET (Latest Sales Order State - Individual Resource)
     * ----------------------------------------------------
     */
    it(`GET /:salesOrderObjID/state/latest: User with SALES_ORDER_READ 
        perm should be able to access the endpoint to retrieve the 
        latest sales order state data for a particular sales order 
        if the sales order was created by someone within the user's 
        user hierarchy`, async (done) => {
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001' });
        await authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
            .expect(200)
            .expect(res => {
                const numOfStates = testSalesOrders[0].orders.length
                expect(res.body.additionalInfo).toBe(testSalesOrders[0].orders[numOfStates - 1].additionalInfo);
                expect(res.body.status).toBe(testSalesOrders[0].orders[numOfStates - 1].status);
                expect(res.body.updatedBy).toBe(testSalesOrders[0].orders[numOfStates - 1].updatedBy);
                for (const [index, part] of res.body.parts.entries()) {
                    expect(part.additionalInfo).toBe(testSalesOrders[0].orders[numOfStates -1].parts[index].additionalInfo);
                    expect(part.fulfilledBy).toStrictEqual(testSalesOrders[0].orders[numOfStates -1].parts[index].fulfilledBy);
                    expect(part.quantity).toBe(testSalesOrders[0].orders[numOfStates -1].parts[index].quantity);
                }
            })
        done();
    })

    it(`GET /:salesOrderObjID/state/latest: User with SALES_ORDER_READ 
        perm should not be able to access the endpoint to retrieve the 
        latest sales order state data for a particular sales order 
        if the sales order was created by someone outside the user's 
        user hierarchy`, async (done) => {
        // Created by `user1`
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000002' });
        await authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
            .expect(403);

        done();
    })

    it(`GET /:salesOrderObjID/state/latest: User without SALES_ORDER_READ 
        perm should not be able to access the endpoint to retrieve the 
        latest sales order state data regardless of user hierarchy`, async (done) => {
        await authenticatedUnauthorizedAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state/latest`)
            .expect(403);

        done();
    })

    it(`GET /:salesOrderObjID/state/latest: User with SALES_ORDER_READ 
        perm should get 400 status code response when providing an
        invalid sales order object ID`, async (done) => {
        // Valid ObjectID, but not from SalesOrderModel
        const partDoc = await PartModel.findOne({});
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${partDoc._id}/state/latest`)
            .expect(400);
        
        // Invalid ObjectID
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/123/state/latest`)
            .expect(400);
        done();
    })
    
    /**
     * ----------------------------------------------------
     * GET (Particular Sales Order State - Individual Resource)
     * ----------------------------------------------------
     */
    it(`GET /:salesOrderObjID/state/:index: User with SALES_ORDER_READ 
        perm should be able to access the endpoint to retrieve the 
        sales order state data at the index for a particular sales order 
        if the sales order was created by someone within the user's 
        user hierarchy`, async (done) => {
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001' });
        
        for (let i = 0; i < testSalesOrders[0].orders.length; i++) {
            await authenticatedReadAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/${i}`)
                .expect(200)
                .expect(res => {
                    const numOfStates = testSalesOrders[0].orders.length
                    expect(res.body.additionalInfo).toBe(testSalesOrders[0].orders[i].additionalInfo);
                    expect(res.body.status).toBe(testSalesOrders[0].orders[i].status);
                    expect(res.body.updatedBy).toBe(testSalesOrders[0].orders[i].updatedBy);
                    for (const [index, part] of res.body.parts.entries()) {
                        expect(part.additionalInfo).toBe(testSalesOrders[0].orders[i].parts[index].additionalInfo);
                        expect(part.fulfilledBy).toStrictEqual(testSalesOrders[0].orders[i].parts[index].fulfilledBy);
                        expect(part.quantity).toBe(testSalesOrders[0].orders[i].parts[index].quantity);
                    }
                })
        }
        done();
    })

    it(`GET /:salesOrderObjID/state/:index: User with SALES_ORDER_READ 
        perm should not be able to access the endpoint to retrieve the 
        sales order state data at the index for a particular sales order 
        if the sales order was created by someone outside the user's 
        user hierarchy`, async (done) => {
        // Created by `user1`
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000002' });
        await authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/0`)
            .expect(403);

        done();
    })

    it(`GET /:salesOrderObjID/state/:index: User without SALES_ORDER_READ 
        perm should not be able to access the endpoint to retrieve the 
        latest sales order state data regardless of user hierarchy`, async (done) => {
        await authenticatedUnauthorizedAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state/0`)
            .expect(403);

        done();
    })

    it(`GET /:salesOrderObjID/state/:index: User with SALES_ORDER_READ 
        perm should get 400 status code response when providing an
        invalid sales order object ID`, async (done) => {
        // Valid ObjectID, but not from SalesOrderModel
        const partDoc = await PartModel.findOne({});
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${partDoc._id}/state/0`)
            .expect(400);
        
        // Invalid ObjectID
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/123/state/0`)
            .expect(400);
        done();
    })

    it(`GET /:salesOrderObjID/state/:index: User with SALES_ORDER_READ 
        perm receive null if the index specified is invalid`, async (done) => {
        const invalidIndex = 1000;
        await authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state/${invalidIndex}`)
            .expect(200)
            .expect(res => {
                expect(res.body).toBeNull();
            });

        done();
    })

    

    // /**
    //  * ----------------------------
    //  * POST (Create a New Supplier)
    //  * ----------------------------
    //  */
    // it(`POST /: User with SALES_ORDER_WRITE perm should
    //     be able to create a new supplier`, async (done) => {
    //     await authenticatedAdminAgent
    //             .post(salesOrderEndpoint)
    //             .send(newSupplier)
    //             .expect(200)

    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .then(res => {
    //                 expect(res.body.suppliers.length).toBe(testSuppliersWithParts.length + 1);
    //             })
    //     done();
    // })

    // it(`POST /: User with SUPPLIER_WRITE perm should
    //     not be able to create a new supplier if the supplier
    //     name field is missing`, async (done) => {
    //     let newSupplierWithoutName = {
    //         address: newSupplier.address,
    //         telephone: newSupplier.telephone, 
    //         fax: newSupplier.fax,
    //         additionalInfo: newSupplier.additionalInfo
    //     }

    //     await authenticatedAdminAgent
    //         .post(salesOrderEndpoint)
    //         .send(newSupplierWithoutName)
    //         .expect(400)
        
    //     done();
    // })

    // it(`POST /: User with SUPPLIER_WRITE perm should
    //     not be able to create a new supplier if the supplier
    //     has the same name as an existing supplier`, async (done) => {
    //     // Create new supplier
    //     await authenticatedAdminAgent
    //         .post(salesOrderEndpoint)
    //         .send(newSupplier)
    //         .expect(200)

    //     // Attempt to create the same supplier (same `name`)
    //     await authenticatedAdminAgent
    //         .post(salesOrderEndpoint)
    //         .send(newSupplier)
    //         .expect(400)
    //         .expect(res => {
    //             expect(res.text).toMatch(/Duplicate Supplier Name/i);
    //         })
        
    //     done();
    // })

    // it(`POST /: User with SUPPLIER_WRITE perm should
    //     not be able to create a new supplier with parts
    //     even if parts are provided in the request`, async (done) => {
    //     let newSupplierWithParts = JSON.parse(JSON.stringify(newSupplier));
    //     newSupplierWithParts.parts = [{
    //         partNumber: 'PN122',
    //         priceHistory: [{
    //             createdBy: `${testUsers[0].username}`,
    //             unitPrice: 0.0001,
    //             additionalInfo: 'Cheap Product'
    //         }, {
    //             createdBy: `${testUsers[0].username}`,
    //             unitPrice: 0.0002,
    //             additionalInfo: 'Product price double owing to supply constraints'
    //         }],
    //         description: 'A jackhammer',
    //     }]

    //     await authenticatedAdminAgent
    //             .post(salesOrderEndpoint)
    //             .send(newSupplierWithParts)
    //             .expect(200)

    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.suppliers[2]).toBeTruthy();
    //                 expect(res.body.suppliers[2].parts.length).toBe(0);
    //             })
        
    //     done();
    // })

    // it(`POST /: User with SUPPLIER_WRITE perm should
    //     not be able to create a new supplier with a
    //     duplicate supplier name. A custom error message
    //     should be returned in the response.`, async (done) => {
    //     let newSupplierWithDuplicateName = JSON.parse(JSON.stringify(newSupplier));
    //     newSupplierWithDuplicateName.name = testSuppliersWithParts[0].name;

    //     await authenticatedAdminAgent
    //             .post(salesOrderEndpoint)
    //             .send(newSupplierWithDuplicateName)
    //             .expect(400)
    //             .expect(res => {
    //                 expect(res.error.text).toBe('Duplicate Supplier Name');
    //             })
        
    //     done();
    // })

    // it(`POST /: User without SUPPLIER_WRITE perm should
    //     not be able to create a new supplier`, async (done) => {
    //     // Has SALES_ORDE_READ perm
    //     await authenticatedReadAgent
    //             .post(salesOrderEndpoint)
    //             .send(newSupplier)
    //             .expect(403)
        
    //     // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
    //     await authenticatedUnauthorizedAgent
    //             .post(salesOrderEndpoint)
    //             .send(newSupplier)
    //             .expect(403)
        
    //     done();
    // })

    // /**
    //  * ----------------------------------
    //  * PATCH (Update Details of Supplier)
    //  * ----------------------------------
    //  */
    // it(`PATCH /:supplierObjID: User with SUPPLIER_WRITE perm
    //     should be able to update supplier details, and the
    //     changes are persisted`, async (done) => {
    //     let fieldsToUpdate = {
    //         name: newSupplier.name, 
    //         address: newSupplier.address
    //     }

    //     await authenticatedAdminAgent
    //             .patch(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .send(fieldsToUpdate)
    //             .expect(200)
        
    //     await authenticatedAdminAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(200)
    //             .expect(res => {
    //                 // Updated fields
    //                 expect(res.body.name).toBe(fieldsToUpdate.name);
    //                 expect(res.body.address).toBe(fieldsToUpdate.address);

    //                 // Unchanged fields
    //                 expect(res.body.telephone).toBe(testSuppliersWithParts[0].telephone);
    //                 expect(res.body.fax).toBe(testSuppliersWithParts[0].fax);
    //                 expect(res.body.additionalInfo).toBe(testSuppliersWithParts[0].additionalInfo);
    //             })
        
    //     done();
    // })

    // it(`PATCH: /:supplierObjID: User with SUPPLIER_WRITE
    //     perm should not be able to update any data when 
    //     an invalid supplierObjID is provided`, async (done) => {
    //     let fieldsToUpdate = {
    //         name: newSupplier.name, 
    //         address: newSupplier.address
    //     }
    //     let originalData = null;
    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .then(res => {
    //                 originalData = res.body;
    //             })

    //     await authenticatedAdminAgent
    //             .patch(`${salesOrderEndpoint}/${partObjID}`)
    //             .send(fieldsToUpdate)
    //             .expect(400)

    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .then(res => {
    //                 expect(res.body).toEqual(originalData);
    //             })
        
    //     done();
    // })

    // it(`PATCH: /:supplierObjID: User without SUPPLIER_WRITE
    //     perm should not be able to update supplier details`, async (done) => {
    //     let fieldsToUpdate = {
    //         name: newSupplier.name, 
    //         address: newSupplier.address
    //     }

    //     // Has SUPPLIER_READ perm
    //     await authenticatedReadAgent
    //             .patch(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .send(fieldsToUpdate)
    //             .expect(403)
        
    //     // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
    //     await authenticatedUnauthorizedAgent
    //             .patch(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .send(fieldsToUpdate)
    //             .expect(403)
        
    //     done();
    // })

    // /**
    //  * ---------------------------------
    //  * DELETE (Delete a single Supplier)
    //  * ---------------------------------
    //  */
    // it(`DELETE /:supplierObjID: User with SUPPLIER_WRITE
    //     perm should be able to delete a supplier. Parts
    //     associated with supplier should also be deleted`, async (done) => {
    //     await authenticatedAdminAgent
    //             .delete(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(200);
        
    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.suppliers.length).toBe(testSuppliersWithParts.length - 1);
    //             })
        
    //     await authenticatedAdminAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(400)
        
    //     // Use `PartModel` directly to prevent testing dependency
    //     // on Parts API (and its correctness)
    //     let partsOfDeletedSupplier = await PartModel.find({ supplier: supplierObjID });
    //     expect(partsOfDeletedSupplier.length).toBe(0);

    //     done();
    // })

    // it(`DELETE /:supplierObjID: User with SUPPLIER_WRITE
    //     perm should not be able to make any data changes
    //     when providing an invalid supplierObjID. However, 
    //     the DELETE request should still have a status code 200
    //     response`, async (done) => {
    //     let originalData = null;
    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .then(res => {
    //                 originalData = res.body;
    //             })

    //     await authenticatedAdminAgent
    //             .delete(`${salesOrderEndpoint}/${partObjID}`)
    //             .expect(200);
        
    //     await authenticatedAdminAgent
    //             .get(salesOrderEndpoint)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body).toEqual(originalData);
    //             })

    //     done();
    // })

    // it(`DELETE /:supplierObjID: User without SUPPLIER_WRITE
    //     perm should not be able to delete a supplier`, async (done) => {
    //     // Has SUPPLIER_READ perm
    //     await authenticatedReadAgent
    //             .delete(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(403)
        
    //     // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
    //     await authenticatedUnauthorizedAgent
    //             .delete(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(403)
        
    //     done();
    // })

    // /**
    //  * -------
    //  * General
    //  * -------
    //  */
    // it(`Unauthenticated users should not be able to access
    //     the Supplier API`, async (done) => {
    //     await request(server)
    //             .get(salesOrderEndpoint)
    //             .expect(401)

    //     await request(server)
    //             .get(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(401)

    //     await request(server)
    //             .post(salesOrderEndpoint)
    //             .send(newSupplier)
    //             .expect(401)

    //     await request(server)
    //             .patch(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .send({ name: newSupplier.name, address: newSupplier.address })
    //             .expect(401)
    
    //     await request(server)
    //             .delete(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(401)
        
    //     done();
    // })
})