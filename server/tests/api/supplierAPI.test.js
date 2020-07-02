const request = require('supertest');
const app = require('../../app');
const { SupplierModel, PartModel } = require('../../data/database');
const queryString = require('query-string');

let testSuppliersWithParts = require('../../data/databaseBootstrap').suppliers;
let testUsers = require('../../data/databaseBootstrap').users;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { supplierEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe.only('Testing /api/v1/supplier endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null; // SUPPLIER_READ, SUPPLIER_WRITE
    let authenticatedReadAgent = null; // SUPPLIER_READ
    let authenticatedUnauthorizedAgent = null; // No access to SUPPLIER API
    let supplierObjID = null;
    let partObjID = null;

    let newSupplier = {
        name: 'E Industries (New Supplier)',
        address: 'Blk 642D Jurong Industrial Estate Lorong 5',
        telephone: '+65 6890 2132',
        fax: '+65 6092 2312',
        additionalInfo: 'Supplier of high-precision components'
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
        await dbi.clearModelData(SupplierModel);
        await dbi.clearModelData(PartModel);

        // Seed Database
        await dbi.addSuppliersAndParts(...testSuppliersWithParts);

        // Obtain supplierObjID and partObjID (for testing)
        let supplierObj = await SupplierModel.findOne({});
        supplierObjID = supplierObj.id;
        partObjID = supplierObj.parts[0];

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
     * GET (collection)
     * ----------------
     */
    it(`GET /: User with SUPPLIER_READ perm should be able
        to access the collection endpoint and retrieve the supplier
        data with default query fields`, async (done) => {
        await authenticatedReadAgent
                .get(supplierEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.suppliers[0].name).toBeTruthy();
                    expect(res.body.suppliers[0].address).toBeTruthy();
                    expect(res.body.suppliers[0].telephone).toBeTruthy();
                    expect(res.body.suppliers[0].fax).toBeTruthy();
                    expect(res.body.suppliers[0].additionalInfo).toBeTruthy();
                    expect(res.body.suppliers[0].parts).toBeTruthy();
                })
        done();
    })

    it(`GET /: User with SUPPLIER_READ perm should be able
        to specify which fields to include in query`, async (done) => {
        // `name` and `telephone` are to be included in response
        let query = queryString.stringify({ inc: ['name', 'telephone']});
        await authenticatedReadAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.suppliers[0].name).toBeTruthy();
                    expect(res.body.suppliers[0].address).not.toBeTruthy();
                    expect(res.body.suppliers[0].telephone).toBeTruthy();
                    expect(res.body.suppliers[0].fax).not.toBeTruthy();
                    expect(res.body.suppliers[0].additionalInfo).not.toBeTruthy();
                    expect(res.body.suppliers[0].parts).not.toBeTruthy();
                })
        done();
    })

    it(`GET /: User with SUPPLIER_READ perm should be able
        to retrieve supplier data with custom filters`, async (done) => {
        // Filter for suppliers with 'drive' (case-insensitive)
        // in their `address` field
        await authenticatedReadAgent
                .get(supplierEndpoint)
                .send({
                    "address": { "$regex": "Drive", "$options": "i"}
                })
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(2);
                })

        // Filter for suppliers whose `telephone` field ends with
        // `9213`
        await authenticatedReadAgent
                .get(supplierEndpoint)
                .send({
                    "telephone": { "$regex": "9213$", "$options": "i"}
                })
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(1);
                })
        done();
    })

    it(`GET /: User with SUPPLIER_READ perm should be able
        to paginate the request`, async (done) => {
        // First Page
        let query = queryString.stringify({ page: 1, limit: 2});
        await authenticatedReadAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(2);
                    expect(res.body.suppliers[0].name).toBe(testSuppliersWithParts[0].name);
                    expect(res.body.suppliers[1].name).toBe(testSuppliersWithParts[1].name);
                    expect(res.body.totalPages).toBe(Math.ceil(testSuppliersWithParts.length / 2));
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({ page: 2, limit: 2});
        await authenticatedReadAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(2);
                    expect(res.body.suppliers[0].name).toBe(testSuppliersWithParts[2].name);
                    expect(res.body.suppliers[1].name).toBe(testSuppliersWithParts[3].name);
                    expect(res.body.totalPages).toBe(Math.ceil(testSuppliersWithParts.length / 2));
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /: User with SUPPLIER_READ perm should be able
        to paginate the request, but response should have no
        suppliers if page exceeds total number of pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(0);
                    expect(res.body.totalPages).toBe(1);
                    expect(res.body.currentPage).toBe(10);
                })
        
        done();
    })

    it(`GET /: User with SUPPLIER_READ perm should be able
        to sort the request`, async (done) => {
        // Sort by descending order for `name` field
        let query = queryString.stringify({ sort: '-name' });
        await authenticatedReadAgent
                .get(`${supplierEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(testSuppliersWithParts.length);
                    expect(res.body.suppliers[0].name).toBe(testSuppliersWithParts[testSuppliersWithParts.length - 1].name);
                    expect(res.body.suppliers[1].name).toBe(testSuppliersWithParts[testSuppliersWithParts.length - 2].name);
                    expect(res.body.suppliers[2].name).toBe(testSuppliersWithParts[testSuppliersWithParts.length - 3].name);
                    expect(res.body.suppliers[3].name).toBe(testSuppliersWithParts[testSuppliersWithParts.length - 4].name);
                })
        done();
    })

    it(`GET /: User without SUPPLIER_READ perm should not be
        able to access the endpoint and retrieve supplier
        data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(supplierEndpoint)
                .expect(403);
        done();
    })


    /**
     * -------------------------
     * GET (individual resource)
     * -------------------------
     */
    it(`GET /:supplierObjID: User with SUPPLIER_READ perm
        should be able to access supplier data with default
        query fields`, async (done) => {
        await authenticatedReadAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBeTruthy();
                    expect(res.body.address).toBeTruthy();
                    expect(res.body.telephone).toBeTruthy();
                    expect(res.body.fax).toBeTruthy();
                    expect(res.body.additionalInfo).toBeTruthy();
                    expect(res.body.parts).toBeTruthy();
                })
        done();
    })

    it(`GET /:supplierObjID: User with SUPPLIER_READ perm
        should be able to access supplier data and specify
        fields to include in query`, async (done) => {
        // Include `name` and `telephone` fields
        let query = queryString.stringify({ inc: ['name', 'telephone']})
        await authenticatedReadAgent
                .get(`${supplierEndpoint}/${supplierObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBeTruthy();
                    expect(res.body.address).not.toBeTruthy();
                    expect(res.body.telephone).toBeTruthy();
                    expect(res.body.fax).not.toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                    expect(res.body.parts).not.toBeTruthy();
                })
        
        // Include `name` only
        query = queryString.stringify({ inc: 'name'})
        await authenticatedReadAgent
                .get(`${supplierEndpoint}/${supplierObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).toBeTruthy();
                    expect(res.body.address).not.toBeTruthy();
                    expect(res.body.telephone).not.toBeTruthy();
                    expect(res.body.fax).not.toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                    expect(res.body.parts).not.toBeTruthy();
                })
        done();
    })

    it(`GET /:supplierObjID: User with SUPPLIER_READ perm
        should not be able to access an invalid supplierObjID`, async (done) => {
        await authenticatedReadAgent
                .get(`${supplierEndpoint}/${partObjID}`)
                .expect(400);
        done();
    })

    it(`GET /:supplierObjID: User without SUPPLIER_READ perm 
        should not be able to access the endpoint and retrieve
        supplier data`, async(done) => {
        await authenticatedUnauthorizedAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(403);
        done();
    })

    /**
     * ----------------------------
     * POST (Create a New Supplier)
     * ----------------------------
     */
    it(`POST /: User with SUPPLIER_WRITE perm should
        be able to create a new supplier`, async (done) => {
        await authenticatedAdminAgent
                .post(supplierEndpoint)
                .send(newSupplier)
                .expect(200)

        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .then(res => {
                    expect(res.body.suppliers.length).toBe(testSuppliersWithParts.length + 1);
                })
        done();
    })

    it(`POST /: User with SUPPLIER_WRITE perm should
        not be able to create a new supplier if the supplier
        name field is missing`, async (done) => {
        let newSupplierWithoutName = {
            address: newSupplier.address,
            telephone: newSupplier.telephone, 
            fax: newSupplier.fax,
            additionalInfo: newSupplier.additionalInfo
        }

        await authenticatedAdminAgent
            .post(supplierEndpoint)
            .send(newSupplierWithoutName)
            .expect(400)
        
        done();
    })

    it(`POST /: User with SUPPLIER_WRITE perm should
        not be able to create a new supplier with parts
        even if parts are provided in the request`, async (done) => {
        let newSupplierWithParts = JSON.parse(JSON.stringify(newSupplier));
        newSupplierWithParts.parts = [{
            partNumber: 'PN122',
            priceHistory: [{
                createdBy: `${testUsers[0].username}`,
                unitPrice: 0.0001,
                additionalInfo: 'Cheap Product'
            }, {
                createdBy: `${testUsers[0].username}`,
                unitPrice: 0.0002,
                additionalInfo: 'Product price double owing to supply constraints'
            }],
            description: 'A jackhammer',
        }]

        await authenticatedAdminAgent
                .post(supplierEndpoint)
                .send(newSupplierWithParts)
                .expect(200)

        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers[2]).toBeTruthy();
                    expect(res.body.suppliers[2].parts.length).toBe(0);
                })
        
        done();
    })

    it(`POST /: User without SUPPLIER_WRITE perm should
        not be able to create a new supplier`, async (done) => {
        // Has SUPPLIER_READ perm
        await authenticatedReadAgent
                .post(supplierEndpoint)
                .send(newSupplier)
                .expect(403)
        
        // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
        await authenticatedUnauthorizedAgent
                .post(supplierEndpoint)
                .send(newSupplier)
                .expect(403)
        
        done();
    })

    /**
     * ----------------------------------
     * PATCH (Update Details of Supplier)
     * ----------------------------------
     */
    it(`PATCH /:supplierObjID: User with SUPPLIER_WRITE perm
        should be able to update supplier details, and the
        changes are persisted`, async (done) => {
        let fieldsToUpdate = {
            name: newSupplier.name, 
            address: newSupplier.address
        }

        await authenticatedAdminAgent
                .patch(`${supplierEndpoint}/${supplierObjID}`)
                .send(fieldsToUpdate)
                .expect(200)
        
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(200)
                .expect(res => {
                    // Updated fields
                    expect(res.body.name).toBe(fieldsToUpdate.name);
                    expect(res.body.address).toBe(fieldsToUpdate.address);

                    // Unchanged fields
                    expect(res.body.telephone).toBe(testSuppliersWithParts[0].telephone);
                    expect(res.body.fax).toBe(testSuppliersWithParts[0].fax);
                    expect(res.body.additionalInfo).toBe(testSuppliersWithParts[0].additionalInfo);
                })
        
        done();
    })

    it(`PATCH: /:supplierObjID: User with SUPPLIER_WRITE
        perm should not be able to update any data when 
        an invalid supplierObjID is provided`, async (done) => {
        let fieldsToUpdate = {
            name: newSupplier.name, 
            address: newSupplier.address
        }
        let originalData = null;
        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .then(res => {
                    originalData = res.body;
                })

        await authenticatedAdminAgent
                .patch(`${supplierEndpoint}/${partObjID}`)
                .send(fieldsToUpdate)
                .expect(400)

        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .then(res => {
                    expect(res.body).toEqual(originalData);
                })
        
        done();
    })

    it(`PATCH: /:supplierObjID: User without SUPPLIER_WRITE
        perm should not be able to update supplier details`, async (done) => {
        let fieldsToUpdate = {
            name: newSupplier.name, 
            address: newSupplier.address
        }

        // Has SUPPLIER_READ perm
        await authenticatedReadAgent
                .patch(`${supplierEndpoint}/${supplierObjID}`)
                .send(fieldsToUpdate)
                .expect(403)
        
        // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
        await authenticatedUnauthorizedAgent
                .patch(`${supplierEndpoint}/${supplierObjID}`)
                .send(fieldsToUpdate)
                .expect(403)
        
        done();
    })

    /**
     * ---------------------------------
     * DELETE (Delete a single Supplier)
     * ---------------------------------
     */
    it(`DELETE /:supplierObjID: User with SUPPLIER_WRITE
        perm should be able to delete a supplier. Parts
        associated with supplier should also be deleted`, async (done) => {
        await authenticatedAdminAgent
                .delete(`${supplierEndpoint}/${supplierObjID}`)
                .expect(200);
        
        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.suppliers.length).toBe(testSuppliersWithParts.length - 1);
                })
        
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(400)
        
        // Use `PartModel` directly to prevent testing dependency
        // on Parts API (and its correctness)
        let partsOfDeletedSupplier = await PartModel.find({ supplier: supplierObjID });
        expect(partsOfDeletedSupplier.length).toBe(0);

        done();
    })

    it(`DELETE /:supplierObjID: User with SUPPLIER_WRITE
        perm should not be able to make any data changes
        when providing an invalid supplierObjID. However, 
        the DELETE request should still have a status code 200
        response`, async (done) => {
        let originalData = null;
        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .then(res => {
                    originalData = res.body;
                })

        await authenticatedAdminAgent
                .delete(`${supplierEndpoint}/${partObjID}`)
                .expect(200);
        
        await authenticatedAdminAgent
                .get(supplierEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body).toEqual(originalData);
                })

        done();
    })

    it(`DELETE /:supplierObjID: User without SUPPLIER_WRITE
        perm should not be able to delete a supplier`, async (done) => {
        // Has SUPPLIER_READ perm
        await authenticatedReadAgent
                .delete(`${supplierEndpoint}/${supplierObjID}`)
                .expect(403)
        
        // Has neither SUPPLIER_READ nor SUPPLIER_WRITE perm
        await authenticatedUnauthorizedAgent
                .delete(`${supplierEndpoint}/${supplierObjID}`)
                .expect(403)
        
        done();
    })

    /**
     * -------
     * General
     * -------
     */
    it(`Unauthenticated users should not be able to access
        the Supplier API`, async (done) => {
        await request(server)
                .get(supplierEndpoint)
                .expect(401)

        await request(server)
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(401)

        await request(server)
                .post(supplierEndpoint)
                .send(newSupplier)
                .expect(401)

        await request(server)
                .patch(`${supplierEndpoint}/${supplierObjID}`)
                .send({ name: newSupplier.name, address: newSupplier.address })
                .expect(401)
    
        await request(server)
                .delete(`${supplierEndpoint}/${supplierObjID}`)
                .expect(401)
        
        done();
    })
})