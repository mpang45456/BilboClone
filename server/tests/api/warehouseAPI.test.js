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
const testSuppliers = require('../../data/databaseBootstrap').suppliers;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { warehouseEndpoint,
        salesOrderEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe('Testing /api/v1/warehouse endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null;         // WAREHOUSE_READ, WAREHOUSE_WRITE
    let authenticatedReadAgent = null;          // WAREHOUSE_READ
    let authenticatedUnauthorizedAgent = null;  // No access to WAREHOUSE API

    const warehouseSalesOrderEndpoint = warehouseEndpoint + '/salesOrder';
    const warehousePurchaseOrderEndpoint = warehouseEndpoint + '/purchaseOrder';

    let salesOrderObjID = null;

    const salesOrderPatchUpdate = { newStatus: SO_STATES.IN_DELIVERY };

    // const newPurchaseOrderMetaData = {
    //     supplierName: testSuppliers[1].name, 
    //     additionalInfo: 'API TEST: New Purchase Order Meta-Data',
    // }

    // const newPurchaseOrderState = {
    //     status: PO_STATES.FULFILLED,
    //     additionalInfo: 'API TEST: Additional Info',
    //     parts: [],
    // }

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
        const salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[3].orderNumber });
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
     * GET (Sales Order Meta-Data: Collection)
     * ---------------------------------------
     */
    it(`GET /salesOrder: User with WAREHOUSE_READ perm should
        be able to access the collection endpoint and retrieve
        the sales order meta-data, but only for sales orders
        that have PREPARING status`, async (done) => {
        await authenticatedReadAgent
                .get(warehouseSalesOrderEndpoint)
                .expect(200)
                .expect(res => {
                    for (let salesOrderMetaData of res.body.salesOrders) {
                        expect(salesOrderMetaData.latestStatus).toBe(SO_STATES.PREPARING);
                    }
                })
        
        done();
    })

    it(`GET /salesOrder: User with WAREHOUSE_READ perm should
        be able to access the collection endpoint and retrieve
        the sales order meta-data, but only for sales orders
        that have PREPARING status`, async (done) => {
        await authenticatedReadAgent
                .get(warehouseSalesOrderEndpoint)
                .expect(200)
                .expect(res => {
                    for (let salesOrderMetaData of res.body.salesOrders) {
                        expect(salesOrderMetaData.latestStatus).toBe(SO_STATES.PREPARING);
                    }
                })
        
        done();
    })


    it(`GET /salesOrder: User with WAREHOUSE_READ perm should be able
        to access the collection endpoint and retrieve the sales
        order meta-data with default query fields`, async (done) => {
        await authenticatedReadAgent
                .get(warehouseSalesOrderEndpoint)
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

    it(`GET /salesOrder: User with WAREHOUSE_READ perm should be able
        to specify which fields to include in query when retrieving
        sales order meta-data`, async (done) => {
        // Inclusion
        let query = queryString.stringify({ inc: ['createdBy', 'orderNumber']});
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
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
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
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
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
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

    it(`GET /salesOrder: User with WAREHOUSE_READ perm should be able
        to retrieve sales order meta-data with custom filters`, async (done) => {
        // Filter for sales orders (meta-data) whose `additionalInfo` field
        // starts with "First"
        filter = {"additionalInfo": { "$regex": "^First", "$options": "i"}};
        query = queryString.stringify({
            filter: JSON.stringify(filter)
        });
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                })
        done();
    })

    it(`GET /salesOrder: User with WAREHOUSE_READ perm should be able
        to paginate the request`, async (done) => {
        // First Page
        let query = queryString.stringify({ page: 1, limit: 2});
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(1);
                    expect(res.body.salesOrders[0].orderNumber).toBe(testSalesOrders[3].orderNumber);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /salesOrder: User with WAREHOUSE_READ perm should be able
        to paginate the request, but response should have no
        sales order meta-data if page exceeds total number of 
        pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(10);
                })
        
        done();
    })

    it(`GET /salesOrder: User without WAREHOUSE_READ perm should not be
        able to access the endpoint and retrieve sales order meta
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(warehouseSalesOrderEndpoint)
                .expect(403);
        done();
    })

    /**
     * -------------------------------------------
     * GET (Sales Order Data: Individual Resource)
     * -------------------------------------------
     */
    it(`GET /salesOrder/:salesOrderObjID: User with WAREHOUSE_READ perm
        should be able to receive collated sales order data (meta-data + 
        state data for PREPARING status)`, async (done) => {
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.orders).not.toBeTruthy();
                    expect(res.body.state).toBeTruthy();
                    expect(res.body.additionalInfo).toBe(testSalesOrders[3].additionalInfo);
                    expect(res.body.latestStatus).toBe(testSalesOrders[3].latestStatus);
                    expect(res.body.state.additionalInfo).toBe(testSalesOrders[3].orders[testSalesOrders[3].orders.length - 1].additionalInfo);
                    expect(res.body.state.updatedBy).toBe(testSalesOrders[3].orders[testSalesOrders[3].orders.length - 1].updatedBy);
                    expect(res.body.state.status).toBe(testSalesOrders[3].orders[testSalesOrders[3].orders.length - 1].status);
                })
        done();
    })

    it(`GET /salesOrder/:salesOrderObjID: User with WAREHOUSE_READ perm
        should not be able to access sales order data (meta/state) via
        the endpoint if the sales order does not have PREPARING status`, async (done) => {
        const nonPreparingSalesOrderDoc = await SalesOrderModel.findOne({ orderNumber: testSalesOrders[0].orderNumber });
        await authenticatedReadAgent
                .get(`${warehouseSalesOrderEndpoint}/${nonPreparingSalesOrderDoc._id}`)
                .expect(403)
        done();
    })

    it(`GET /salesOrder/:salesOrderObjID: User without WAREHOUSE_READ perm
        should not be able to access endpoint`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .expect(403)
        done();
    })

    /**
     * ---------------------------------
     * PATCH (Update Sales Order Status)
     * ---------------------------------
     */
    it(`PATCH /salesOrder/:salesOrderObjID: User with WAREHOUSE_WRITE
        perm should be able to update status of sales order`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .send(salesOrderPatchUpdate)
                .expect(200);
        
        done();
    })

    it(`PATCH /salesOrder/:salesOrderObjID: When user with
        WAREHOUSE_WRITE perm updates the status of a sales order, 
        the latest state should be appended to the sales order and
        the sales order's latest status (meta/state) should be updated`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .send(salesOrderPatchUpdate)
                .expect(200);

        // Latest state should be appended to sales order
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testSalesOrders[3].orders.length + 1);
                })

        // Latest state (meta-data) should be updated
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.latestStatus).toBe(SO_STATES.IN_DELIVERY);
                })

        // Latest state (state data) should be updated
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}/state/latest`)
                .expect(200)
                .expect(res => {
                    expect(res.body.status).toBe(SO_STATES.IN_DELIVERY);
                })
        
        done();
    })

    it(`PATCH /salesOrder/:salesOrderObjID: After user with
        WAREHOUSE_WRITE perm updates the status of a sales order, 
        user should no longer be able to retrieve sales order data
        via the warehouse API`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .send(salesOrderPatchUpdate)
                .expect(200);

        await authenticatedAdminAgent
                .get(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .expect(403);
                
        done();
    })

    it(`PATCH /salesOrder/:salesOrderObjID: User with WAREHOUSE_READ
        perm should not be able to change status to any status other
        than IN_DELIVERY`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .send({ newStatus: SO_STATES.FULFILLED })
                .expect(400);

        // No changes to latest state
        await authenticatedAdminAgent
                .get(`${salesOrderEndpoint}/${salesOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.latestStatus).not.toBe(SO_STATES.FULFILLED);
                    expect(res.body.orders.length).toBe(testSalesOrders[3].orders.length);
                })
                
        done();
    })



     // it(`POST /: User with WAREHOUSE_WRITE perm should
    //     be able to create a new purchase order meta-data`, async (done) => {
    //     // Create new Purchase Order Meta-Data
    //     await authenticatedAdminAgent
    //             .post(warehouseEndpoint)
    //             .send(newPurchaseOrderMetaData)
    //             .expect(200)

    //     // Should be able to retrieve in GET (collection) method
    //     await authenticatedAdminAgent
    //             .get(warehouseEndpoint)
    //             .expect(200)
    //             .then(res => {
    //                 expect(res.body.purchaseOrders.length).toBe(testPurchaseOrders.length + 1);
    //             })
    //     done();
    // })

    // it(`POST /: User with WAREHOUSE_WRITE perm should
    //     not be able to create a new purchase order meta data 
    //     if the supplier name field is missing`, async (done) => {
    //     const newPurchaseOrderMetaDataWithoutSupplierName = JSON.parse(JSON.stringify(newPurchaseOrderMetaData));
    //     delete newPurchaseOrderMetaDataWithoutSupplierName.supplierName;

    //     await authenticatedAdminAgent
    //         .post(warehouseEndpoint)
    //         .send(newPurchaseOrderMetaDataWithoutSupplierName)
    //         .expect(400)
        
    //     done();
    // })

    // it(`POST /: User with WAREHOUSE_WRITE perm should
    //     not be able to specify 'createdBy', 'orderNumber'
    //     and 'latestStatus' fields when creating a new
    //     sales order meta-data, even if the values are
    //     provided in the request`, async (done) => {
    //     const newPurchaseOrderMetaDataWithExtraData = JSON.parse(JSON.stringify(newPurchaseOrderMetaData));
    //     newPurchaseOrderMetaDataWithExtraData.createdBy = testUsers[3].username;
    //     newPurchaseOrderMetaDataWithExtraData.latestStatus = PO_STATES.FULFILLED;
    //     newPurchaseOrderMetaDataWithExtraData.orderNumber = 'PO-INVALID';

    //     let newPurchaseOrderObjID = null;
    //     await authenticatedAdminAgent
    //             .post(warehouseEndpoint)
    //             .send(newPurchaseOrderMetaDataWithExtraData)
    //             .expect(200)
    //             .then(res => {
    //                 newPurchaseOrderObjID = res.body._id;
    //             })

    //     await authenticatedAdminAgent
    //             .get(`${purchaseOrderEndpoint}/${newPurchaseOrderObjID}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.createdBy).not.toBe(newPurchaseOrderMetaDataWithExtraData.createdBy);
    //                 expect(res.body.createdBy).toBe(testUsers[0].username);
    //                 expect(res.body.latestStatus).not.toBe(newPurchaseOrderMetaDataWithExtraData.latestStatus);
    //                 expect(res.body.latestStatus).toBe(PO_STATES.NEW);
    //                 expect(res.body.orderNumber).not.toBe(newPurchaseOrderMetaDataWithExtraData.orderNumber);
    //             })
        
    //     done();
    // })

    // it(`POST /: User without WAREHOUSE_WRITE perm should
    //     not be able to create a new purchase order meta-data`, async (done) => {
    //     // Has PURCHASE_ORDER_READ perm
    //     await authenticatedReadAgent
    //             .post(purchaseOrderEndpoint)
    //             .send(newPurchaseOrderMetaData)
    //             .expect(403)
        
    //     // Has neither PURCHASE_ORDER_READ nor WAREHOUSE_WRITE perm
    //     await authenticatedUnauthorizedAgent
    //             .post(purchaseOrderEndpoint)
    //             .send(newPurchaseOrderMetaData)
    //             .expect(403)
        
    //     done();
    // })

    // /**
    //  * --------------------------------------------------
    //  * GET (Purchase Order Meta-Data: Individual Resource)
    //  * --------------------------------------------------
    //  */
    // it(`GET /:purchaseOrderObjID: User with PURCHASE_ORDER_READ perm
    //     should not be able to access an invalid purchaseOrderObjID`, async (done) => {
    //     // Invalid ObjID (valid for another collection)
    //     const partDoc = await PartModel.findOne({});
    //     await authenticatedReadAgent
    //             .get(`${purchaseOrderEndpoint}/${partDoc._id}`)
    //             .expect(400);

    //     // Invalid ObjID (wrong format)
    //     await authenticatedReadAgent
    //             .get(`${purchaseOrderEndpoint}/123`)
    //             .expect(400);
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID: User without PURCHASE_ORDER_READ perm 
    //     should not be able to access the endpoint and retrieve
    //     purchase order meta data`, async(done) => {
    //     await authenticatedUnauthorizedAgent
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}`)
    //             .expect(403);
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID: User with PURCHASE_ORDER_READ perm
    //     should only be able to access a purchase order meta data
    //     created by a user under the user in the user hierarchy`, async (done) => {
    //     // `admin` user creates a purchase order meta data object
    //     let adminCreatedPurchaseOrderMetaDataObjID = null;
    //     authenticatedAdminAgent
    //         .post(purchaseOrderEndpoint)
    //         .send(newPurchaseOrderMetaData)
    //         .expect(200)
    //         .then(res => {
    //             adminCreatedPurchaseOrderMetaDataObjID = res.body._id;
    //         })

    //     // `user4` user creates a purchase order meta data object
    //     let user4CreatedPurchaseOrderMetaDataObjID = null;
    //     const user4Account = testUsers[4];
    //     const authenticatedUser4Agent = await getAuthenticatedAgent(server, 
    //                                                                 user4Account.username, 
    //                                                                 user4Account.password);
    //     authenticatedUser4Agent
    //         .post(purchaseOrderEndpoint)
    //         .send(newPurchaseOrderMetaData)
    //         .expect(200)
    //         .then(res => {
    //             user4CreatedPurchaseOrderMetaDataObjID = res.body._id;
    //         })
    
    //     // `user1` should only be able to access the purchase order
    //     // meta data object created by `user4` but not `admin`
    //     const user1Account = testUsers[1];
    //     const authenticatedUser1Agent = await getAuthenticatedAgent(server, 
    //                                                                 user1Account.username, 
    //                                                                 user1Account.password);
    //     authenticatedUser1Agent
    //         .get(`${purchaseOrderEndpoint}/${adminCreatedPurchaseOrderMetaDataObjID}`)
    //         .expect(403);
    //     authenticatedUser1Agent
    //         .get(`${purchaseOrderEndpoint}/${user4CreatedPurchaseOrderMetaDataObjID}`)
    //         .expect(200)
    //         .expect(res => {
    //             expect(res.body.createdBy).toBe(user4Account.username);
    //             expect(res.body.latestStatus).toBe(PO_STATES.NEW);
    //             expect(res.body.additionalInfo).toBe(newPurchaseOrderMetaData.additionalInfo);
    //             expect(res.body.orderNumber).toBeTruthy();
    //             expect(res.body.orders).toBeTruthy();
    //             expect(res.body.supplier.name).toBe(newPurchaseOrderMetaData.supplierName);
    //         })

    //     done();
    // })

    // /**
    //  * -------------------------------------------
    //  * GET (Purchase Order State Data - Collection)
    //  * -------------------------------------------
    //  */
    // it(`GET /:purchaseOrderObjID/state: User with PURCHASE_ORDER_READ 
    //     perm should be able to read purchase order meta data with
    //     default query fields`, async (done) => {
    //     authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state`)
    //         .expect(200)
    //         .expect(res => {
    //             expect(res.body.length).toBe(testPurchaseOrders[0].orders.length);
    //             expect(res.body[0].status).toBeTruthy();
    //             expect(res.body[0].additionalInfo).toBeTruthy();
    //             expect(res.body[0].parts).toBeTruthy();
    //             expect(res.body[0].updatedBy).toBeTruthy();
    //         })
        
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state: User with PURCHASE_ORDER_READ 
    //     perm should be able to read purchase order meta data with
    //     custom query fields`, async (done) => {
    //     let query = queryString.stringify({ inc: ['status', 'updatedBy', 'updatedAt'] });
    //     authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state`)
    //         .expect(200)
    //         .expect(res => {
    //             expect(res.body.length).toBe(testPurchaseOrders[0].orders.length);
    //             expect(res.body[0].status).toBeTruthy();s
    //             expect(res.body[0].additionalInfo).not.toBeTruthy();
    //             expect(res.body[0].parts).not.toBeTruthy();
    //             expect(res.body[0].updatedBy).toBeTruthy();
    //             expect(res.body[0].updatedAt).toBeTruthy();
    //         })
        
    //     done();
    // })
    
    // it(`GET /:purchaseOrderObjID/state: User with PURCHASE_ORDER_READ 
    //     perm should only be able to access purchase order state data
    //     if the purchase order meta data is created by a user that is
    //     in the requesting user's user hierarchy`, async (done) => {
    //     // Created by `user1` (so readable by `admin` but not `user3`)
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000002' });

    //     // `admin` user account
    //     authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //         .expect(200)
    //         .expect(res => {
    //             expect(res.body.length).toBe(2);
    //         })

    //     // `user4` user account
    //     const user4 = testUsers[4];
    //     authenticatedUser4Account = await getAuthenticatedAgent(server, user4.username, user4.password);
    //     authenticatedUser4Account
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //         .expect(403);
        
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state: User without PURCHASE_ORDER_READ 
    //     perm should not be able to access the endpoint and read
    //     purchase order state data`, async (done) => {
    //     authenticatedUnauthorizedAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state`)
    //         .expect(403);

    //     done();
    // })
    
    // /**
    //  * ----------------------------------------------------
    //  * GET (Latest Sales Order State - Individual Resource)
    //  * ----------------------------------------------------
    //  */
    // it(`GET /:purchaseOrderObjID/state/latest: User with PURCHASE_ORDER_READ 
    //     perm should be able to access the endpoint to retrieve the 
    //     latest purchase order state data for a particular purchase order 
    //     if the purchase order was created by someone within the user's 
    //     user hierarchy`, async (done) => {
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    //     await authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/latest`)
    //         .expect(200)
    //         .expect(res => {
    //             const numOfStates = testPurchaseOrders[0].orders.length;
    //             expect(res.body.additionalInfo).toBe(testPurchaseOrders[0].orders[numOfStates - 1].additionalInfo);
    //             expect(res.body.status).toBe(testPurchaseOrders[0].orders[numOfStates - 1].status);
    //             expect(res.body.updatedBy).toBe(testPurchaseOrders[0].orders[numOfStates - 1].updatedBy);
    //             for (const [index, part] of res.body.parts.entries()) {
    //                 expect(part.additionalInfo).toBe(testPurchaseOrders[0].orders[numOfStates -1].parts[index].additionalInfo);
    //                 expect(part.fulfilledBy).toStrictEqual(testPurchaseOrders[0].orders[numOfStates -1].parts[index].fulfilledBy);
    //                 expect(part.quantity).toBe(testPurchaseOrders[0].orders[numOfStates -1].parts[index].quantity);
    //             }
    //         })
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/latest: User with PURCHASE_ORDER_READ 
    //     perm should not be able to access the endpoint to retrieve the 
    //     latest purchase order state data for a particular purchase order 
    //     if the purchase order was created by someone outside the user's 
    //     user hierarchy`, async (done) => {
    //     // Created by `user3`
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    //     const user4 = testUsers[4];
    //     authenticatedUser4Agent = await getAuthenticatedAgent(server, user4.username, user4.password);
    //     await authenticatedUser4Agent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/latest`)
    //         .expect(403);

    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/latest: User without PURCHASE_ORDER_READ 
    //     perm should not be able to access the endpoint to retrieve the 
    //     latest purchase order state data regardless of user hierarchy`, async (done) => {
    //     await authenticatedUnauthorizedAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state/latest`)
    //         .expect(403);

    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/latest: User with PURCHASE_ORDER_READ 
    //     perm should get 400 status code response when providing an
    //     invalid purchase order object ID`, async (done) => {
    //     // Valid ObjectID, but not from PurchaseOrderModel
    //     const partDoc = await PartModel.findOne({});
    //     await authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${partDoc._id}/state/latest`)
    //         .expect(400);
        
    //     // Invalid ObjectID
    //     await authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/123/state/latest`)
    //         .expect(400);
    //     done();
    // })
    
    // /**
    //  * --------------------------------------------------------
    //  * GET (Particular Sales Order State - Individual Resource)
    //  * --------------------------------------------------------
    //  */
    // it(`GET /:purchaseOrderObjID/state/:index: User with PURCHASE_ORDER_READ 
    //     perm should be able to access the endpoint to retrieve the 
    //     purchase order state data at the index for a particular purchase order 
    //     if the purchase order was created by someone within the user's 
    //     user hierarchy`, async (done) => {
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
        
    //     for (let i = 0; i < testPurchaseOrders[0].orders.length; i++) {
    //         await authenticatedReadAgent
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/${i}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.additionalInfo).toBe(testPurchaseOrders[0].orders[i].additionalInfo);
    //                 expect(res.body.status).toBe(testPurchaseOrders[0].orders[i].status);
    //                 expect(res.body.updatedBy).toBe(testPurchaseOrders[0].orders[i].updatedBy);
    //                 for (const [index, part] of res.body.parts.entries()) {
    //                     expect(part.additionalInfo).toBe(testPurchaseOrders[0].orders[i].parts[index].additionalInfo);
    //                     expect(part.fulfilledBy).toStrictEqual(testPurchaseOrders[0].orders[i].parts[index].fulfilledBy);
    //                     expect(part.quantity).toBe(testPurchaseOrders[0].orders[i].parts[index].quantity);
    //                 }
    //             })
    //     }
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/:index: User with PURCHASE_ORDER_READ 
    //     perm should not be able to access the endpoint to retrieve the 
    //     purchase order state data at the index for a particular purchase order 
    //     if the purchase order was created by someone outside the user's 
    //     user hierarchy`, async (done) => {
    //     // Created by `user3`
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    //     const user4 = testUsers[4];
    //     authenticatedUser4Agent = await getAuthenticatedAgent(server, user4.username, user4.password);
    //     await authenticatedUser4Agent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/0`)
    //         .expect(403);

    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/:index: User without PURCHASE_ORDER_READ 
    //     perm should not be able to access the endpoint to retrieve the 
    //     latest purchase order state data regardless of user hierarchy`, async (done) => {
    //     await authenticatedUnauthorizedAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state/0`)
    //         .expect(403);

    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/:index: User with PURCHASE_ORDER_READ 
    //     perm should get 400 status code response when providing an
    //     invalid purchase order object ID`, async (done) => {
    //     // Valid ObjectID, but not from PurchaseOrderModel
    //     const partDoc = await PartModel.findOne({});
    //     await authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/${partDoc._id}/state/0`)
    //         .expect(400);
        
    //     // Invalid ObjectID
    //     await authenticatedAdminAgent
    //         .get(`${purchaseOrderEndpoint}/123/state/0`)
    //         .expect(400);
    //     done();
    // })

    // it(`GET /:purchaseOrderObjID/state/:index: User with PURCHASE_ORDER_READ 
    //     perm receive null if the index specified is invalid`, async (done) => {
    //     const invalidIndex = 1000;
    //     await authenticatedReadAgent
    //         .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state/${invalidIndex}`)
    //         .expect(200)
    //         .expect(res => {
    //             expect(res.body).toBeNull();
    //         });

    //     done();
    // })

    // /**
    //  * ----------------------------------------
    //  * POST (Create a New Purchase Order State)
    //  * ----------------------------------------
    //  */
    // it(`POST /:purchaseOrderObjID/state: User with PURCHASE_ORDER_WRITE
    //     perm should be able to create a new purchase order state if
    //     the purchase order was created by someone within the user's
    //     user hierarchy`, async (done) => {
    //     // Purchase Order created by `user3`
    //     const user3Account = testUsers[3];
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ createdBy: user3Account.username });

    //     // Create Purchase Order State (by `admin`)
    //     await authenticatedAdminAgent
    //             .post(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .send(newPurchaseOrderState)
    //             .expect(200);

    //     // Check that Purchase Order State has been created
    //     await authenticatedAdminAgent
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/latest`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.status).toBe(newPurchaseOrderState.status);
    //                 expect(res.body.additionalInfo).toBe(newPurchaseOrderState.additionalInfo);
    //                 expect(res.body.parts).toStrictEqual(newPurchaseOrderState.parts);
    //             })
        
    //     done();
    // })

    // it(`POST /:purchaseOrderObjID/state: User with PURCHASE_ORDER_WRITE
    //     perm should not be able to create a new purchase order state if
    //     the purchase order was created by someone outside the user's
    //     user hierarchy`, async (done) => {
    //     // Create Purchase Order (by `admin` account)
    //     let newPurchaseOrderObjID = null;
    //     await authenticatedAdminAgent
    //             .post(purchaseOrderEndpoint)
    //             .send({
    //                 supplierName: testSuppliers[0].name,
    //                 additionalInfo: 'API TEST: Additional Info (Admin)'
    //             })
    //             .expect(200)
    //             .expect(res => {
    //                 newPurchaseOrderObjID = res.body._id;
    //             })

    //     // Create Purchase Order State (Unauthorised)
    //     const user4Account = testUsers[4];
    //     const authenticatedUser4Agent = await getAuthenticatedAgent(server, 
    //                                                                 user4Account.username, 
    //                                                                 user4Account.password);
    //     await authenticatedUser4Agent
    //             .post(`${purchaseOrderEndpoint}/${newPurchaseOrderObjID}/state`)
    //             .send(newPurchaseOrderState)
    //             .expect(403);
        
    //     done();
    // })

    // it(`POST /:purchaseOrderObjID/state: When user with PURCHASE_ORDER_WRITE
    //     perm creates new purchase order state, the state should be appended
    //     to the purchase order`, async (done) => {
    //     // Purchase Order created by `user3`
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ createdBy: testPurchaseOrders[0].createdBy });

    //     // Create Purchase Order State
    //     await authenticatedAdminAgent
    //             .post(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .send(newPurchaseOrderState)
    //             .expect(200);

    //     // Check that Purchase Order State has been created
    //     await authenticatedAdminAgent
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.length).toBe(testPurchaseOrders[0].orders.length + 1);
    //             })
        
    //     done();
    // })
    
    // it(`POST /:purchaseOrderObjID/state: When user with PURCHASE_ORDER_WRITE
    //     perm creates new purchase order state, the purchase order's latest status
    //     should be updated to the new state's status`, async (done) => {
    //     // Purchase Order created by `user3`
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ createdBy: testPurchaseOrders[0].createdBy });

    //     // Create Purchase Order State
    //     await authenticatedAdminAgent
    //             .post(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .send(newPurchaseOrderState)
    //             .expect(200);

    //     // Check that Purchase Order State has been created
    //     await authenticatedAdminAgent
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.latestStatus).toBe(newPurchaseOrderState.status);
    //             })
        
    //     done();
    // })

    // /**
    //  * -------
    //  * General
    //  * -------
    //  */
    // it(`Unauthenticated users should not be able to access
    //     the Purchase Order API`, async (done) => {
    //     const purchaseOrderDoc = await PurchaseOrderModel.findOne({ });
    //     await request(server)
    //             .get(purchaseOrderEndpoint)
    //             .expect(401)
        
    //     await request(server)
    //             .post(purchaseOrderEndpoint)
    //             .send(newPurchaseOrderMetaData)
    //             .expect(401)

    //     await request(server)
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}`)
    //             .expect(401)

    //     await request(server)
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .expect(401)

    //     await request(server)
    //             .post(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state`)
    //             .send(newPurchaseOrderState)
    //             .expect(401)

    //     await request(server)
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/latest`)
    //             .expect(401)

    //     await request(server)
    //             .get(`${purchaseOrderEndpoint}/${purchaseOrderDoc._id}/state/0`)
    //             .expect(401)
        
    //     done();
    // })
})