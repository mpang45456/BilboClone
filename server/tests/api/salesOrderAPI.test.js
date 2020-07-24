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
    let authenticatedAdminAgent = null;         // SALES_ORDER_READ, SALES_ORDER_WRITE
    let authenticatedReadAgent = null;          // SALES_ORDER_READ
    let authenticatedUnauthorizedAgent = null;  // No access to SALES_ORDER API

    let salesOrderObjID = null;

    const newSalesOrderMetaData = {
        customerName: testCustomers[1].name, 
        additionalInfo: 'API TEST: New Sales Order Meta-Data',
    }

    const newSalesOrderState = {
        status: SO_STATES.FULFILLED,
        additionalInfo: 'API TEST: Additional Info',
        parts: [],
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
                    expect(res.body.salesOrders.length).toBe(4);
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

    it(`POST /: After user with SALES_ORDER_WRITE perm
        creates new sales order meta data, the latest state
        for the sales order should have QUOTATION status and
        should be empty`, async (done) => {
        let salesOrderObjID = null;
        // Create new Sales Order Meta-Data
        await authenticatedAdminAgent
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaData)
                .expect(200)
                .expect(res => {
                    salesOrderObjID = res.body._id;
                })

        // Check latest state
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}/state/latest`)
                .expect(200)
                .then(res => {
                    expect(res.body.status).toBe(SO_STATES.QUOTATION);
                    expect(res.body.additionalInfo).toBe('');
                    expect(res.body.parts).toStrictEqual([]);
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
        newSalesOrderMetaDataWithExtraData.createdBy = testUsers[3].username;
        newSalesOrderMetaDataWithExtraData.latestStatus = SO_STATES.FULFILLED;
        newSalesOrderMetaDataWithExtraData.orderNumber = 'SO-INVALID';

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
                    expect(res.body.latestStatus).toBe(SO_STATES.QUOTATION);
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
        await authenticatedAdminAgent
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
        await authenticatedUser4Agent
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
        await authenticatedUser1Agent
            .get(`${salesOrderEndpoint}/${adminCreatedSalesOrderMetaDataObjID}`)
            .expect(403);
        await authenticatedUser1Agent
            .get(`${salesOrderEndpoint}/${user4CreatedSalesOrderMetaDataObjID}`)
            .expect(200)
            .expect(res => {
                expect(res.body.createdBy).toBe(user4Account.username);
                expect(res.body.latestStatus).toBe(SO_STATES.QUOTATION);
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
        await authenticatedAdminAgent
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
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${salesOrderObjID}/state?${query}`)
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
        await authenticatedAdminAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
            .expect(200)
            .expect(res => {
                expect(res.body.length).toBe(2);
            })

        // `user3` user account
        await authenticatedReadAgent
            .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
            .expect(403);
        
        done();
    })

    it(`GET /:salesOrderObjID/state: User without SALES_ORDER_READ 
        perm should not be able to access the endpoint and read
        sales order state data`, async (done) => {
        await authenticatedUnauthorizedAgent
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
     * --------------------------------------------------------
     * GET (Particular Sales Order State - Individual Resource)
     * --------------------------------------------------------
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

    /**
     * -------------------------------------
     * POST (Create a New Sales Order State)
     * -------------------------------------
     */
    it(`POST /:salesOrderObjID/state: User with SALES_ORDER_WRITE
        perm should be able to create a new sales order state if
        the sales order was created by someone within the user's
        user hierarchy`, async (done) => {
        // Sales Order created by `user3`
        const user3Account = testUsers[3];
        const salesOrderDoc = await SalesOrderModel.findOne({ createdBy: user3Account.username });

        // New State made by `user1`
        const user1Account = testUsers[1];
        const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
                                                                    user1Account.username, 
                                                                    user1Account.password);
        
        // Create Sales Order State
        await authenticatedUser1Agent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newSalesOrderState)
                .expect(200);

        // Check that Sales Order State has been created
        await authenticatedUser1Agent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
                .expect(200)
                .expect(res => {
                    expect(res.body.status).toBe(newSalesOrderState.status);
                    expect(res.body.additionalInfo).toBe(newSalesOrderState.additionalInfo);
                    expect(res.body.parts).toStrictEqual(newSalesOrderState.parts);
                })
        
        done();
    })

    it(`POST /:salesOrderObjID/state: User with SALES_ORDER_WRITE
        perm should not be able to create a new sales order state if
        the sales order was created by someone outside the user's
        user hierarchy`, async (done) => {
        // Create Sales Order (by `admin` account)
        let newSalesOrderObjID = null;
        await authenticatedAdminAgent
                .post(salesOrderEndpoint)
                .send({
                    customerName: testCustomers[0].name,
                    additionalInfo: 'API TEST: Additional Info (Admin)'
                })
                .expect(200)
                .expect(res => {
                    newSalesOrderObjID = res.body._id;
                })

        // Create Sales Order State (Unauthorised)
        const user1Account = testUsers[1];
        const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
                                                                    user1Account.username, 
                                                                    user1Account.password);
        await authenticatedUser1Agent
                .post(`${salesOrderEndpoint}/${newSalesOrderObjID}/state`)
                .send(newSalesOrderState)
                .expect(403);
        
        done();
    })

    it(`POST /:salesOrderObjID/state: When user with SALES_ORDER_WRITE
        perm creates new sales order state, the state should be appended
        to the sales order`, async (done) => {
        // Sales Order created by `user3`
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });

        // New State made by `user1`
        const user1Account = testUsers[1];
        const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
                                                                    user1Account.username, 
                                                                    user1Account.password);
        
        // Create Sales Order State
        await authenticatedUser1Agent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newSalesOrderState)
                .expect(200);

        // Check that Sales Order State has been created
        await authenticatedUser1Agent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSalesOrders[0].orders.length + 1);
                })
        
        done();
    })
    
    it(`POST /:salesOrderObjID/state: When user with SALES_ORDER_WRITE
        perm creates new sales order state, the sale order's latest status
        should be updated to the new state's status`, async (done) => {
        // Sales Order created by `user3`
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });

        // New State made by `user1`
        const user1Account = testUsers[1];
        const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
                                                                    user1Account.username, 
                                                                    user1Account.password);
        
        // Create Sales Order State
        await authenticatedUser1Agent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newSalesOrderState)
                .expect(200);

        // Check that Sales Order State has been created
        await authenticatedUser1Agent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.latestStatus).toBe(newSalesOrderState.status);
                })
        
        done();
    })

    it(`POST /:salesOrderObjID/state: When user with SALES_ORDER_WRITE
        perm creates new sales order state to perform parts allocation for the
        first time, purchase order state is updated`, async (done) => {
        // Obtain Sales Order
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });
        
        // Create Sales Order State
        const part0 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[0].partNumber });
        const part1 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[1].partNumber });
        const part2 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[2].partNumber });
        let poDoc0 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        let poDoc1 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[1].orderNumber });
        const newState = {
            "status": SO_STATES.CONFIRMED,
            "additionalInfo": "Performing Allocation For First Time",
            "parts": [
                {
                    "part": String(part0._id),
                    "quantity": 1000,
                    "additionalInfo": "From POST Request: BA2132-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 200
                        }
                    ]
                },
                {
                    "part": String(part1._id),
                    "quantity": 800,
                    "additionalInfo": "From POST Request: BA9871-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 800
                        }
                    ]
                },
                {
                    "part": String(part2._id),
                    "quantity": 950,
                    "additionalInfo": "From POST Request: 121-BX-N",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc1._id),
                            "quantity": 950
                        }
                    ]
                }
            ]
        }

        await authenticatedAdminAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newState)
                .expect(200);

        // Check that Sales Order State has been created
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
                .expect(200)
                .expect(res => {
                    expect(res.body.status).toBe(newState.status);
                    expect(res.body.additionalInfo).toBe(newState.additionalInfo);
                    for (let [index, partInfo] of res.body.parts.entries()) {
                        expect(partInfo.part).toBe(newState.parts[index].part);
                        expect(partInfo.quantity).toBe(newState.parts[index].quantity);
                        expect(partInfo.additionalInfo).toBe(newState.parts[index].additionalInfo);
                        for (let [fulfilledByIndex, fulfilledByTarget] of partInfo.fulfilledBy.entries()) {
                            expect(fulfilledByTarget.purchaseOrder).toBe(newState.parts[index].fulfilledBy[fulfilledByIndex].purchaseOrder);
                            expect(fulfilledByTarget.quantity).toBe(newState.parts[index].fulfilledBy[fulfilledByIndex].quantity);
                        }
                    }
                })

        // Check that Purchase Orders have been populated
        for (let soPartInfo of newState.parts) {
            const poDoc = await PurchaseOrderModel.findOne({ _id: soPartInfo.fulfilledBy[0].purchaseOrder });
            const latestPOState = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1] });
            const poStatePartIndex = latestPOState.parts.findIndex(poPartInfo => String(poPartInfo.part) === String(soPartInfo.part));
            expect(poStatePartIndex).not.toBe(-1);
            expect(latestPOState.parts[poStatePartIndex].fulfilledFor.length).toBe(1);
            expect(String(latestPOState.parts[poStatePartIndex].fulfilledFor[0].salesOrder)).toBe(String(salesOrderDoc._id));
            expect(latestPOState.parts[poStatePartIndex].fulfilledFor[0].quantity).toBe(soPartInfo.fulfilledBy[0].quantity);
        }
        
        done();
    })

    it(`POST /:salesOrderObjID/state: When user with SALES_ORDER_WRITE
        perm creates multiple new sales order states to perform parts 
        allocation in stages, purchase order state only reflects the latest
        part allocation (there should be no remnants/side effects from 
        previous part allocations)`, async (done) => {
        // Obtain Sales Order
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });
        
        // Create Sales Order State
        const part0 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[0].partNumber });
        const part1 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[1].partNumber });
        const part2 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[2].partNumber });
        let poDoc0 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        let poDoc1 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[1].orderNumber });
        const newState0 = {
            "status": SO_STATES.CONFIRMED,
            "additionalInfo": "Performing Allocation For First Time",
            "parts": [
                {
                    "part": String(part0._id),
                    "quantity": 1000,
                    "additionalInfo": "From POST Request: BA2132-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 250
                        }
                    ]
                },
                {
                    "part": String(part1._id),
                    "quantity": 800,
                    "additionalInfo": "From POST Request: BA9871-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 700
                        }
                    ]
                },
            ]
        }
        const newState1 = {
            "status": SO_STATES.CONFIRMED,
            "additionalInfo": "Performing Allocation For Second Time",
            "parts": [
                {
                    "part": String(part0._id),
                    "quantity": 1000,
                    "additionalInfo": "From POST Request: BA2132-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 1000
                        }
                    ]
                },
                {
                    "part": String(part1._id),
                    "quantity": 800,
                    "additionalInfo": "From POST Request: BA9871-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 800
                        }
                    ]
                },
                {
                    "part": String(part2._id),
                    "quantity": 950,
                    "additionalInfo": "From POST Request: 121-BX-N",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc1._id),
                            "quantity": 950
                        }
                    ]
                }
            ]
        }

        // First Part Allocation
        await authenticatedAdminAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newState0)
                .expect(200);
        
        // Second Part Allocation
        await authenticatedAdminAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newState1)
                .expect(200);

        // Check that both Sales Order States were created
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSalesOrders[0].orders.length + 2);
                });

        // Check that latest Sales Order State is accurate
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
                .expect(200)
                .expect(res => {
                    expect(res.body.status).toBe(newState1.status);
                    expect(res.body.additionalInfo).toBe(newState1.additionalInfo);
                    for (let [index, partInfo] of res.body.parts.entries()) {
                        expect(partInfo.part).toBe(newState1.parts[index].part);
                        expect(partInfo.quantity).toBe(newState1.parts[index].quantity);
                        expect(partInfo.additionalInfo).toBe(newState1.parts[index].additionalInfo);
                        for (let [fulfilledByIndex, fulfilledByTarget] of partInfo.fulfilledBy.entries()) {
                            expect(fulfilledByTarget.purchaseOrder).toBe(newState1.parts[index].fulfilledBy[fulfilledByIndex].purchaseOrder);
                            expect(fulfilledByTarget.quantity).toBe(newState1.parts[index].fulfilledBy[fulfilledByIndex].quantity);
                        }
                    }
                })

        // Check that Purchase Orders have been populated
        for (let soPartInfo of newState1.parts) {
            const poDoc = await PurchaseOrderModel.findOne({ _id: soPartInfo.fulfilledBy[0].purchaseOrder });
            const latestPOState = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1] });
            const poStatePartIndex = latestPOState.parts.findIndex(poPartInfo => String(poPartInfo.part) === String(soPartInfo.part));
            expect(poStatePartIndex).not.toBe(-1);
            expect(latestPOState.parts[poStatePartIndex].fulfilledFor.length).toBe(1);
            expect(String(latestPOState.parts[poStatePartIndex].fulfilledFor[0].salesOrder)).toBe(String(salesOrderDoc._id));
            expect(latestPOState.parts[poStatePartIndex].fulfilledFor[0].quantity).toBe(soPartInfo.fulfilledBy[0].quantity);
        }
        
        done();
    })

    it(`POST /:salesOrderObjID/state: When part allocations are 
        mapped from multiple sales orders to the same purchase
        order, the purchase order state should be updated correctly
        (and the allocation from one sales order should not affect
        that of another sales order)`, async (done) => {
        // Obtain Sales Orders
        const salesOrderDoc0 = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });
        const salesOrderDoc1 = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[1].orderNumber });
        
        // Create Sales Order 0 State
        let part0 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[0].partNumber });
        let part1 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[1].partNumber });
        let part2 = await PartModel.findOne({ partNumber: testSalesOrders[0].orders[1].parts[2].partNumber });
        let poDoc0 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        let poDoc1 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[1].orderNumber });
        const newState0 = {
            "status": SO_STATES.CONFIRMED,
            "additionalInfo": "Performing Allocation For First Time",
            "parts": [
                {
                    "part": String(part0._id),
                    "quantity": 1000,
                    "additionalInfo": "From POST Request: BA2132-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 1000
                        }
                    ]
                },
                {
                    "part": String(part1._id),
                    "quantity": 800,
                    "additionalInfo": "From POST Request: BA9871-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 800
                        }
                    ]
                },
                {
                    "part": String(part2._id),
                    "quantity": 950,
                    "additionalInfo": "From POST Request: 121-BX-N",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc1._id),
                            "quantity": 950
                        }
                    ]
                }
            ]
        }
        
        // Sales Order 0 Part Allocation
        await authenticatedAdminAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc0._id}/state`)
                .send(newState0)
                .expect(200);

        // Create Sales Order 1 State
        part0 = await PartModel.findOne({ partNumber: testSalesOrders[1].orders[1].parts[0].partNumber });
        part1 = await PartModel.findOne({ partNumber: testSalesOrders[1].orders[1].parts[1].partNumber });
        poDoc0 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        let newState1 = {
            "status": SO_STATES.CONFIRMED,
            "additionalInfo": "Performing Allocation For First Time",
            "parts": [
                {
                    "part": String(part0._id),
                    "quantity": 2500,
                    "additionalInfo": "From POST Request: BA2132-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 2500
                        }
                    ]
                },
                {
                    "part": String(part1._id),
                    "quantity": 300,
                    "additionalInfo": "From POST Request: BA2133-21Z",
                    "fulfilledBy": [
                        { 
                            "purchaseOrder": String(poDoc0._id),
                            "quantity": 300
                        }
                    ]
                },
            ]
        }
        
        // Sales Order 1 Part Allocation
        await authenticatedAdminAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc1._id}/state`)
                .send(newState1)
                .expect(200);

        // Check that both Sales Order States were created
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc0._id}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSalesOrders[0].orders.length + 1);
                });

        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderDoc1._id}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSalesOrders[1].orders.length + 1);
                });
        
        // Check that Purchase Orders have been populated
        poDoc0 = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        const latestPOState = await PurchaseOrderStateModel.findOne({ _id: poDoc0.orders[poDoc0.orders.length - 1] });
        expect(latestPOState.parts[0].fulfilledFor.length).toBe(2);
        expect(String(latestPOState.parts[0].fulfilledFor[0].salesOrder)).toBe(String(salesOrderDoc0._id));
        expect(latestPOState.parts[0].fulfilledFor[0].quantity).toBe(newState0.parts[0].fulfilledBy[0].quantity);
        expect(String(latestPOState.parts[0].fulfilledFor[1].salesOrder)).toBe(String(salesOrderDoc1._id));
        expect(latestPOState.parts[0].fulfilledFor[1].quantity).toBe(newState1.parts[0].fulfilledBy[0].quantity);
        
        expect(latestPOState.parts[1].fulfilledFor.length).toBe(1);
        expect(String(latestPOState.parts[1].fulfilledFor[0].salesOrder)).toBe(String(salesOrderDoc1._id));
        expect(latestPOState.parts[1].fulfilledFor[0].quantity).toBe(newState1.parts[1].fulfilledBy[0].quantity);
        
        expect(latestPOState.parts[2].fulfilledFor.length).toBe(1);
        expect(String(latestPOState.parts[2].fulfilledFor[0].salesOrder)).toBe(String(salesOrderDoc0._id));
        expect(latestPOState.parts[2].fulfilledFor[0].quantity).toBe(newState0.parts[1].fulfilledBy[0].quantity);
        
        done();
    })

    it(`POST /:salesOrderObjID/state: User without SALES_ORDER_WRITE
        perm should not be able to create a new sales order state`, async (done) => {
        const salesOrderDoc = await SalesOrderModel.findOne({ });
        
        // Create Sales Order State
        await authenticatedUnauthorizedAgent
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newSalesOrderState)
                .expect(403);

        done();
    })

    /**
     * -------
     * General
     * -------
     */
    it(`Unauthenticated users should not be able to access
        the Sales Order API`, async (done) => {
        const salesOrderDoc = await SalesOrderModel.findOne({ });
        await request(server)
                .get(salesOrderEndpoint)
                .expect(401)
        
        await request(server)
                .post(salesOrderEndpoint)
                .send(newSalesOrderMetaData)
                .expect(401)

        await request(server)
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}`)
                .expect(401)

        await request(server)
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .expect(401)

        await request(server)
                .post(`${salesOrderEndpoint}/${salesOrderDoc._id}/state`)
                .send(newSalesOrderState)
                .expect(401)

        await request(server)
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/latest`)
                .expect(401)

        await request(server)
                .get(`${salesOrderEndpoint}/${salesOrderDoc._id}/state/0`)
                .expect(401)
        
        done();
    })
})