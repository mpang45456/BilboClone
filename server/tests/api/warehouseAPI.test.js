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
        purchaseOrderEndpoint,
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
    let purchaseOrderObjID = null;

    const salesOrderPatchUpdate = { newStatus: SO_STATES.IN_DELIVERY };
    const purchaseOrderPatchUpdate = { newStatus: PO_STATES.RECEIVED };

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
        const purchaseOrderDoc = await PurchaseOrderModel.findOne({ orderNumber: testPurchaseOrders[0].orderNumber });
        purchaseOrderObjID = purchaseOrderDoc._id; // readable by `authenticatedReadAgent`

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

    /**
     * ------------------------------------------
     * GET (Purchase Order Meta-Data: Collection)
     * ------------------------------------------
     */
    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should
        be able to access the collection endpoint and retrieve
        the purchase order meta-data, but only for purchase orders
        that have CONFIRMED status`, async (done) => {
        await authenticatedReadAgent
                .get(warehousePurchaseOrderEndpoint)
                .expect(200)
                .expect(res => {
                    for (let purchaseOrderMetaData of res.body.purchaseOrders) {
                        expect(purchaseOrderMetaData.latestStatus).toBe(PO_STATES.CONFIRMED);
                    }
                })
        
        done();
    })

    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should be able
        to access the collection endpoint and retrieve the purchase
        order meta-data with default query fields`, async (done) => {
        await authenticatedReadAgent
                .get(warehousePurchaseOrderEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.purchaseOrders[0].createdBy).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.purchaseOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.purchaseOrders[0].supplier).toBeTruthy();
                    expect(res.body.purchaseOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orders).toBeTruthy();
                })
        done();
    })

    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should be able
        to specify which fields to include in query when retrieving
        purchase order meta-data`, async (done) => {
        // Inclusion
        let query = queryString.stringify({ inc: ['createdBy', 'orderNumber']});
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.purchaseOrders[0].createdBy).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.purchaseOrders[0].latestStatus).not.toBeTruthy();
                    expect(res.body.purchaseOrders[0].supplier).toBeTruthy(); // Supplier will be included unless explicitly excluded
                    expect(res.body.purchaseOrders[0].additionalInfo).not.toBeTruthy();
                    expect(res.body.purchaseOrders[0].orders).not.toBeTruthy();
                })
        
        // Exclusion
        query = queryString.stringify({ inc: ['-createdBy']});
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.purchaseOrders[0].createdBy).not.toBeTruthy();
                    expect(res.body.purchaseOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.purchaseOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.purchaseOrders[0].supplier).toBeTruthy(); // Supplier will be included unless explicitly excluded
                    expect(res.body.purchaseOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orders).toBeTruthy();
                })

        // Exclusion (`supplier` field)
        query = queryString.stringify({ inc: ['-supplier']});
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.purchaseOrders[0].createdBy).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orderNumber).toBeTruthy();
                    expect(res.body.purchaseOrders[0].latestStatus).toBeTruthy();
                    expect(res.body.purchaseOrders[0].supplier).not.toBeTruthy(); // Supplier will be included unless explicitly excluded
                    expect(res.body.purchaseOrders[0].additionalInfo).toBeTruthy();
                    expect(res.body.purchaseOrders[0].orders).toBeTruthy();
                })
        done();
    })

    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should be able
        to retrieve purchase order meta-data with custom filters`, async (done) => {
        // Filter for purchase orders (meta-data) whose `additionalInfo` field
        // starts with "First"
        filter = {"additionalInfo": { "$regex": "^First", "$options": "i"}};
        query = queryString.stringify({
            filter: JSON.stringify(filter)
        });
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBe(1);
                })
        done();
    })

    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should be able
        to paginate the request`, async (done) => {
        // First Page
        let query = queryString.stringify({ page: 1, limit: 2});
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBe(2);
                    expect(res.body.purchaseOrders[0].orderNumber).toBe(testPurchaseOrders[0].orderNumber);
                    expect(res.body.purchaseOrders[1].orderNumber).toBe(testPurchaseOrders[1].orderNumber);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /purchaseOrder: User with WAREHOUSE_READ perm should be able
        to paginate the request, but response should have no
        purchase order meta-data if page exceeds total number of 
        pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.purchaseOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(10);
                })
        
        done();
    })

    it(`GET /purchaseOrder: User without WAREHOUSE_READ perm should not be
        able to access the endpoint and retrieve purchase order meta
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(warehousePurchaseOrderEndpoint)
                .expect(403);
        done();
    })

    /**
     * ----------------------------------------------
     * GET (Purchase Order Data: Individual Resource)
     * ----------------------------------------------
     */
    it(`GET /purchaseOrder/:purchaseOrderObjID: User with WAREHOUSE_READ perm
        should be able to receive collated purchase order data (meta-data + 
        state data for CONFIRMED status)`, async (done) => {
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.orders).not.toBeTruthy();
                    expect(res.body.state).toBeTruthy();
                    expect(res.body.additionalInfo).toBe(testPurchaseOrders[0].additionalInfo);
                    expect(res.body.latestStatus).toBe(testPurchaseOrders[0].latestStatus);
                    expect(res.body.state.additionalInfo).toBe(testPurchaseOrders[0].orders[testPurchaseOrders[0].orders.length - 1].additionalInfo);
                    expect(res.body.state.updatedBy).toBe(testPurchaseOrders[0].orders[testPurchaseOrders[0].orders.length - 1].updatedBy);
                    expect(res.body.state.status).toBe(testPurchaseOrders[0].orders[testPurchaseOrders[0].orders.length - 1].status);
                })
        done();
    })

    it(`GET /purchaseOrder/:purchaseOrderObjID: User with WAREHOUSE_READ perm
        should not be able to access purchase order data (meta/state) via
        the endpoint if the purchase order does not have CONFIRMED status`, async (done) => {
        const nonConfirmedPurchaseOrderDoc = await PurchaseOrderModel.findOne({ latestStatus: PO_STATES.QUOTATION });
        await authenticatedReadAgent
                .get(`${warehousePurchaseOrderEndpoint}/${nonConfirmedPurchaseOrderDoc._id}`)
                .expect(403)
        done();
    })

    it(`GET /purchaseOrder/:purchaseOrderObjID: User without WAREHOUSE_READ perm
        should not be able to access endpoint`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(403)
        done();
    })

    /**
     * ------------------------------------
     * PATCH (Update Purchase Order Status)
     * ------------------------------------
     */
    it(`PATCH /purchaseOrder/:purchaseOrderObjID: User with WAREHOUSE_WRITE
        perm should be able to update status of purchase order`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .send(purchaseOrderPatchUpdate)
                .expect(200);
        
        done();
    })

    it(`PATCH /purchaseOrder/:purchaseOrderObjID: When user with
        WAREHOUSE_WRITE perm updates the status of a purchase order, 
        the latest state should be appended to the purchase order and
        the purchase order's latest status (meta/state) should be updated`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .send(purchaseOrderPatchUpdate)
                .expect(200);

        // Latest state should be appended to purchase order
        await authenticatedAdminAgent
                .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state`)
                .expect(200)
                .expect(res => {
                    expect(res.body.length).toBe(testPurchaseOrders[0].orders.length + 1);
                })

        // Latest state (meta-data) should be updated
        await authenticatedAdminAgent
                .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.latestStatus).toBe(PO_STATES.RECEIVED);
                })

        // Latest state (state data) should be updated
        await authenticatedAdminAgent
                .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}/state/latest`)
                .expect(200)
                .expect(res => {
                    expect(res.body.status).toBe(PO_STATES.RECEIVED);
                })
        
        done();
    })

    it(`PATCH /purchaseOrder/:purchaseOrderObjID: After user with
        WAREHOUSE_WRITE perm updates the status of a purchase order, 
        user should no longer be able to retrieve purchase order data
        via the warehouse API`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .send(purchaseOrderPatchUpdate)
                .expect(200);

        await authenticatedAdminAgent
                .get(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(403);
                
        done();
    })

    it(`PATCH /purchaseOrder/:purchaseOrderObjID: User with WAREHOUSE_READ
        perm should not be able to change status to any status other
        than IN_DELIVERY`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .send({ newStatus: PO_STATES.FULFILLED })
                .expect(400);

        // No changes to latest state
        await authenticatedAdminAgent
                .get(`${purchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.latestStatus).not.toBe(PO_STATES.FULFILLED);
                    expect(res.body.orders.length).toBe(testPurchaseOrders[0].orders.length);
                })
                
        done();
    })

    /**
     * -------
     * General
     * -------
     */
    it(`Unauthenticated users should not be able to access
        the Warehouse API`, async (done) => {
        // Warehouse (Sales Order) API
        await request(server)
                .get(warehouseSalesOrderEndpoint)
                .expect(401)
        
        await request(server)
                .get(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .expect(401)

        await request(server)
                .patch(`${warehouseSalesOrderEndpoint}/${salesOrderObjID}`)
                .send(salesOrderPatchUpdate)
                .expect(401)
        
        // Warehouse (Purchase Order) API
        await request(server)
                .get(warehousePurchaseOrderEndpoint)
                .expect(401)
        
        await request(server)
                .get(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .expect(401)

        await request(server)
                .patch(`${warehousePurchaseOrderEndpoint}/${purchaseOrderObjID}`)
                .send(salesOrderPatchUpdate)
                .expect(401)
        
        done();
    })
})