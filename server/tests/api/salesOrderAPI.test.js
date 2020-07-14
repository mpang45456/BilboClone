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
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { salesOrderEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe.only('Testing /api/v1/salesOrder endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null;         // SALES_ORDER_READ, SALES_ORDER_WRITE, SALES_ORDER_<STATUS>_READ/WRITE
    let authenticatedReadAgent = null;          // SALES_ORDER_READ
    let authenticatedUnauthorizedAgent = null;  // No access to SALES_ORDER API
    // TODO: Add SALES_ORDER_<STATUS>_READ/WRITE Perms

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

        // Login
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
        const readUser = testUsers[3];
        authenticatedReadAgent = await getAuthenticatedAgent(server, readUser.username, readUser.password);
        const unauthorizedUser = testUsers[4];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, unauthorizedUser.username, unauthorizedUser.password);

        done();
    })

    /**
     * ---------------------------------------
     * GET (Sales Order Meta-Data: collection)
     * ---------------------------------------
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
                    expect(res.body.salesOrders.length).toBe(2);
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
                    expect(res.body.salesOrders[1].orderNumber).toBe(testSalesOrders[1].orderNumber);
                    expect(res.body.totalPages).toBe(Math.ceil(testSalesOrders.length / 2));
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedReadAgent
                .get(`${salesOrderEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.salesOrders.length).toBe(0);
                    expect(res.body.totalPages).toBe(Math.ceil(testSalesOrders.length / 2));
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
                    expect(res.body.salesOrders.length).toBe(testSalesOrders.length);
                    expect(res.body.salesOrders[0].orderNumber).toBe(testSalesOrders[testSalesOrders.length - 1].orderNumber);
                    expect(res.body.salesOrders[1].orderNumber).toBe(testSalesOrders[testSalesOrders.length - 2].orderNumber);
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


    // /**
    //  * -------------------------
    //  * GET (individual resource)
    //  * -------------------------
    //  */
    // it(`GET /:supplierObjID: User with SALES_ORDER_READ perm
    //     should be able to access supplier data with default
    //     query fields`, async (done) => {
    //     await authenticatedReadAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.name).toBeTruthy();
    //                 expect(res.body.address).toBeTruthy();
    //                 expect(res.body.telephone).toBeTruthy();
    //                 expect(res.body.fax).toBeTruthy();
    //                 expect(res.body.additionalInfo).toBeTruthy();
    //                 expect(res.body.parts).toBeTruthy();
    //             })
    //     done();
    // })

    // it(`GET /:supplierObjID: User with SALES_ORDE_READ perm
    //     should be able to access supplier data and specify
    //     fields to include in query`, async (done) => {
    //     // Include `name` and `telephone` fields
    //     let query = queryString.stringify({ inc: ['name', 'telephone']})
    //     await authenticatedReadAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}?${query}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.name).toBeTruthy();
    //                 expect(res.body.address).not.toBeTruthy();
    //                 expect(res.body.telephone).toBeTruthy();
    //                 expect(res.body.fax).not.toBeTruthy();
    //                 expect(res.body.additionalInfo).not.toBeTruthy();
    //                 expect(res.body.parts).not.toBeTruthy();
    //             })
        
    //     // Include `name` only
    //     query = queryString.stringify({ inc: 'name'})
    //     await authenticatedReadAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}?${query}`)
    //             .expect(200)
    //             .expect(res => {
    //                 expect(res.body.name).toBeTruthy();
    //                 expect(res.body.address).not.toBeTruthy();
    //                 expect(res.body.telephone).not.toBeTruthy();
    //                 expect(res.body.fax).not.toBeTruthy();
    //                 expect(res.body.additionalInfo).not.toBeTruthy();
    //                 expect(res.body.parts).not.toBeTruthy();
    //             })
    //     done();
    // })

    // it(`GET /:supplierObjID: User with SALES_ORDE_READ perm
    //     should not be able to access an invalid supplierObjID`, async (done) => {
    //     // Invalid ObjID (valid for another collection)
    //     await authenticatedReadAgent
    //             .get(`${salesOrderEndpoint}/${partObjID}`)
    //             .expect(400);

    //     // Invalid ObjID (wrong format)
    //     await authenticatedReadAgent
    //             .get(`${salesOrderEndpoint}/123`)
    //             .expect(400);
    //     done();
    // })

    // it(`GET /:supplierObjID: User without SALES_ORDE_READ perm 
    //     should not be able to access the endpoint and retrieve
    //     supplier data`, async(done) => {
    //     await authenticatedUnauthorizedAgent
    //             .get(`${salesOrderEndpoint}/${supplierObjID}`)
    //             .expect(403);
    //     done();
    // })

    // /**
    //  * ----------------------------
    //  * POST (Create a New Supplier)
    //  * ----------------------------
    //  */
    // it(`POST /: User with SUPPLIER_WRITE perm should
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