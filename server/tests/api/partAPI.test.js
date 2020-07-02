const request = require('supertest');
const app = require('../../app');
const { SupplierModel, PartModel } = require('../../data/database');
const queryString = require('query-string');

let testSuppliersWithParts = require('../../data/databaseBootstrap').suppliers;
let testUsers = require('../../data/databaseBootstrap').users;
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { partEndpoint,
        supplierEndpoint,
        getAuthenticatedAgent } = require('./testUtils');
const CONFIG = require('../../config');

describe('Testing /api/v1/part endpoint', () => {
    let dbi = null;
    let server = null;
    let authenticatedAdminAgent = null; // PART_READ, PART_WRITE
    let authenticatedReadAgent = null; // PART_READ
    let authenticatedUnauthorizedAgent = null; // No access to PART API
    
    let allTestParts = [];
    let supplierObjID = null;
    let partObjID = null;

    let newPartWithPrice = {
        partNumber: 'AA-101',
        unitPrice: 0.01,
        priceAdditionalInfo: 'Stable price',
        description: 'Double A Batteries',
        additionalInfo: 'Company has offered a bulk purchase discount'
    }

    let newPartWithoutPrice = {
        partNumber: 'AAA-102',
        description: 'Triple A batteries',
        additionalInfo: 'NIL'
    }

    beforeAll(async (done) => {
        dbi = new DatabaseInteractor();
        await dbi.initConnection(true);

        // Find all Parts
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

        // Obtain supplierObjID and partObjID (for testing)
        let partObj = await PartModel.findOne({});
        partObjID = partObj.id;
        supplierObjID = partObj.supplier;

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
                    expect(res.body.parts.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.parts.length).toBe(allTestParts.length);
                    expect(res.body.parts[0].supplier).toBeTruthy();
                    expect(res.body.parts[0].partNumber).toBeTruthy();
                    expect(res.body.parts[0].priceHistory).toBeTruthy();
                    expect(res.body.parts[0].description).toBeTruthy();
                    expect(res.body.parts[0].status).toBeTruthy();
                    expect(res.body.parts[0].additionalInfo).toBeTruthy();
                    expect(res.body.totalPages).toBe(Math.ceil(allTestParts.length / CONFIG.DEFAULT_PAGE_LIMIT));
                    expect(res.body.currentPage).toBe(1);
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
                    expect(res.body.parts.length).toBeLessThanOrEqual(CONFIG.DEFAULT_PAGE_LIMIT);
                    expect(res.body.parts.length).toBe(allTestParts.length);

                    // Fields included in response should be customised
                    expect(res.body.parts[0].supplier).toBeTruthy();
                    expect(res.body.parts[0].partNumber).toBeTruthy();
                    expect(res.body.parts[0].priceHistory).not.toBeTruthy();
                    expect(res.body.parts[0].description).not.toBeTruthy();
                    expect(res.body.parts[0].status).not.toBeTruthy();
                    expect(res.body.parts[0].additionalInfo).not.toBeTruthy();
                })

        // Negative inclusion (include everything except ____)
        query = queryString.stringify({inc: '-description'});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    for (let part of res.body.parts) {
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
                    expect(res.body.parts.length).toBe(allTestParts.length-1);
                    expect(res.body.totalPages).toBe(2);
                    expect(res.body.currentPage).toBe(1);
                })
        
        // Second Page
        query = queryString.stringify({page: 2, limit: allTestParts.length-1});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(1);
                    expect(res.body.totalPages).toBe(2);
                    expect(res.body.currentPage).toBe(2);
                })
        done();
    })

    it(`GET /: User with PART_READ perm should be able
        to paginate the request, but response should have no
        parts data if page exceeds total number of pages`, async (done) => {
        let query = queryString.stringify({ page: 10, limit: 20 });
        await authenticatedReadAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(0);
                    expect(res.body.totalPages).toBe(Math.ceil(allTestParts.length / 20));
                    expect(res.body.currentPage).toBe(10);
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
                    expect(res.body.parts.length).toBe(allTestParts.length);
                    expect(res.body.parts[0].partNumber).toBe(sortedParts[0].partNumber);
                    expect(res.body.parts[res.body.parts.length-1].partNumber).toBe(sortedParts[sortedParts.length-1].partNumber);
                })
        
        // Descending Sort
        query = queryString.stringify({sort: '-partNumber'});
        await authenticatedAdminAgent
                .get(`${partEndpoint}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(allTestParts.length);
                    expect(res.body.parts[0].partNumber).toBe(sortedParts[sortedParts.length-1].partNumber);
                    expect(res.body.parts[res.body.parts.length-1].partNumber).toBe(sortedParts[0].partNumber);
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
                    expect(res.body.parts.length).toBe(2);
                })
        
        filter = {"$or": [{"description": "RFID receiver"}, {"description": "RFID transmitter"}]};
        await authenticatedAdminAgent
                .get(partEndpoint)
                .send(filter)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(2);
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

    /**
     * -------------------------------------
     * GET /:partObjID (Individual Resource)
     * -------------------------------------
     */
    it(`GET /:partObjID: User with PART_READ perm should
        be able to access the endpoint and retrieve part
        data with default query fields`, async (done) => {
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.supplier).toBeTruthy();
                    expect(res.body.partNumber).toBeTruthy();
                    expect(res.body.priceHistory).toBeTruthy();
                    expect(res.body.description).toBeTruthy();
                    expect(res.body.status).toBeTruthy();
                    expect(res.body.additionalInfo).toBeTruthy();
                })

        done();
    })

    it(`GET /:partObjID: User with PART_READ perm should
        be able to access the endpoint and retrieve part
        data with custom query fields`, async (done) => {
        // Include `supplier` and `partNumber` fields
        let query = queryString.stringify({ inc: ['supplier', 'partNumber']})
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.supplier).toBeTruthy();
                    expect(res.body.partNumber).toBeTruthy();
                    expect(res.body.priceHistory).not.toBeTruthy();
                    expect(res.body.description).not.toBeTruthy();
                    expect(res.body.status).not.toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                })

        // Include `supplier` field only
        query = queryString.stringify({ inc: 'supplier'})
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}?${query}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.supplier).toBeTruthy();
                    expect(res.body.partNumber).not.toBeTruthy();
                    expect(res.body.priceHistory).not.toBeTruthy();
                    expect(res.body.description).not.toBeTruthy();
                    expect(res.body.status).not.toBeTruthy();
                    expect(res.body.additionalInfo).not.toBeTruthy();
                })

        done();
    })

    it(`GET /:partObjID: User with PART_READ perm should
        not be able to access an invalid partObjID`, async (done) => {
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${supplierObjID}`)
                .expect(400)

        done();
    })

    it(`GET /:partObjID: User without PART_READ perm should
        not be able to access the endpoint and retrieve
        part data`, async (done) => {
        await authenticatedUnauthorizedAgent
                .get(`${partEndpoint}/partObjID`)
                .expect(403)
        
        done();
    })

    /**
     * ------------------------
     * POST (Create a New Part)
     * ------------------------
     */
    it(`POST /: User with PART_WRITE perm should be able to
        access the endpoint and create a new part (with initial
        price quotation)`, async (done) => {
        // Set up part with supplierObjID
        let newPart = JSON.parse(JSON.stringify(newPartWithPrice));
        newPart.supplierObjID = supplierObjID;

        let newPartObjID = null;
        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(200)
                .then(res => {
                    newPartObjID = res.body._id;
                })

        // Should be able to view new part (individually)
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${newPartObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.partNumber).toBe(newPart.partNumber);
                    expect(res.body.supplier).toBe(supplierObjID.toString());
                    expect(res.body.priceHistory[0].unitPrice).toBe(newPartWithPrice.unitPrice);
                    expect(res.body.priceHistory[0].additionalInfo).toBe(newPartWithPrice.priceAdditionalInfo);
                    expect(res.body.priceHistory[0].createdBy).toBe(testUsers[0].username);
                    expect(res.body.priceHistory[0].createdAt).toBeTruthy();
                    expect(res.body.priceHistory[0].updatedAt).toBeTruthy();
                    expect(res.body.description).toBe(newPart.description);
                    expect(res.body.status).toBe('ACTIVE');
                    expect(res.body.additionalInfo).toBe(newPart.additionalInfo);
                })

        // Should be able to view new part (in collection) 
        await authenticatedAdminAgent
                .get(partEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(allTestParts.length + 1);
                })
        
        done();
    })

    it(`POST /: User with PART_WRITE perm should be able to
        access the endpoint and create a new part (without initial
        price quotation)`, async (done) => {
        // Set up part with supplierObjID
        let newPart = JSON.parse(JSON.stringify(newPartWithoutPrice));
        newPart.supplierObjID = supplierObjID;

        let newPartObjID = null;
        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(200)
                .then(res => {
                    newPartObjID = res.body._id;
                })

        // Should be able to view new part (individually)
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${newPartObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.partNumber).toBe(newPart.partNumber);
                    expect(res.body.supplier).toBe(supplierObjID.toString());
                    expect(res.body.priceHistory.length).toBe(0);
                    expect(res.body.description).toBe(newPart.description);
                    expect(res.body.status).toBe('ACTIVE');
                    expect(res.body.additionalInfo).toBe(newPart.additionalInfo);
                })

        // Should be able to view new part (in collection) 
        await authenticatedAdminAgent
                .get(partEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(allTestParts.length + 1);
                })
        
        done();
    })

    it(`POST /: User with PART_WRITE perm should not be 
        able to create a new part if the required fields are
        missing`, async (done) => {
        // `supplerObjID` missing
        let newPart = JSON.parse(JSON.stringify(newPartWithPrice));
        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(400)

        // `partNumber` missing
        newPart = JSON.parse(JSON.stringify(newPartWithPrice));
        newPart.supplierObjID = supplierObjID;
        delete newPart.partNumber;
        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(400)
        
        // Both `supplierObjID` and `partNumber` missing
        newPart = JSON.parse(JSON.stringify(newPartWithPrice));
        delete newPart.partNumber;
        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(400)

        done();
    })

    it(`POST /: User with PART_WRITE perm should be able
        to create a new part, and the supplier document associated
        with that part should also be updated to reflect the new
        part`, async (done) => {
        let initialNumberOfParts = null;
        await authenticatedAdminAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(200)
                .expect(res => {
                    initialNumberOfParts = res.body.parts.length;
                })
        
        // Set up part with supplierObjID
        let newPart = JSON.parse(JSON.stringify(newPartWithoutPrice));
        newPart.supplierObjID = supplierObjID;

        await authenticatedAdminAgent
                .post(partEndpoint)
                .send(newPart)
                .expect(200)

        await authenticatedAdminAgent
                .get(`${supplierEndpoint}/${supplierObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(initialNumberOfParts + 1);
                })
        
        done();
    })

    it(`POST /: User without PART_WRITE perm should not
        be able to access the endpoint and create a new
        part`, async (done) => {
        // With PART_READ perm
        await authenticatedReadAgent
                .post(partEndpoint)
                .send(newPartWithPrice)
                .expect(403);

        // With neither PART_READ nor PART_WRITE perm
        await authenticatedUnauthorizedAgent
                .post(partEndpoint)
                .send(newPartWithPrice)
                .expect(403);

        done();
    })

    /**
     * ---------------------
     * PATCH (Update a Part)
     * ---------------------
     */
    it(`PATCH /:partObjID: User with PART_WRITE perm should be
        able to access the endpoint and update part details
        (non-priceHistory)`, async (done) => {
        await authenticatedAdminAgent
                .patch(`${partEndpoint}/${partObjID}`)
                .send({
                    partNumber: newPartWithPrice.partNumber,
                    status: 'ARCHIVED'
                })
                .expect(200)

        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toBeTruthy();
                    expect(res.body.partNumber).toBe(newPartWithPrice.partNumber);
                    expect(res.body.status).toBe('ARCHIVED');
                })

        done();
    })

    it(`PATCH /:partObjID: User with PART_WRITE perm should be
        able to access the endpoint and update part details
        (priceHistory). PriceHistory should be appended, not 
        updated in place`, async (done) => {
        let newPriceQuotation = {
            unitPrice: 0.99,
            priceAdditionalInfo: 'Huge increase in price'
        }

        // Get original PriceHistory
        let origPriceHistory = [];
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}`)
                .expect(200)
                .expect(res => {
                    origPriceHistory = res.body.priceHistory;
                })

        await authenticatedAdminAgent
                .patch(`${partEndpoint}/${partObjID}`)
                .send(newPriceQuotation)
                .expect(200)

        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toBeTruthy();
                    expect(res.body.priceHistory.length).toBe(origPriceHistory.length + 1);
                    expect(res.body.priceHistory[res.body.priceHistory.length - 1].createdBy)
                            .toBe(testUsers[0].username);
                    expect(res.body.priceHistory[res.body.priceHistory.length - 1].unitPrice)
                            .toBe(newPriceQuotation.unitPrice);
                    expect(res.body.priceHistory[res.body.priceHistory.length - 1].additionalInfo)
                            .toBe(newPriceQuotation.priceAdditionalInfo);
                })

        done();
    })

    it(`PATCH /:partObjID: User without PART_WRITE perm
        should not be able to access the endpoint and update
        part details`, async (done) => {
        // With PART_READ perm
        await authenticatedReadAgent
                .patch(`${partEndpoint}/${partObjID}`)
                .send(newPartWithPrice)
                .expect(403);

        // With neither PART_READ nor PART_WRITE perm
        await authenticatedUnauthorizedAgent
                .patch(`${partEndpoint}/${partObjID}`)
                .send(newPartWithPrice)
                .expect(403);

        done();
    })

    /**
     * ---------------------------
     * DELETE (An Individual Part)
     * ---------------------------
     */
    it(`DELETE /:partObjID: User with PART_WRITE perm
        should be able to access the endpoint and delete
        a part. Part should not longer be accessible via
        the PART API`, async (done) => {
        await authenticatedAdminAgent
                .delete(`${partEndpoint}/${partObjID}`)
                .expect(200)

        // Unable to retrieve individual part details
        await authenticatedAdminAgent
                .get(`${partEndpoint}/${partObjID}`)
                .expect(400)

        // Unable to retrieve deleted part's details in collection
        await authenticatedAdminAgent
                .get(partEndpoint)
                .expect(200)
                .expect(res => {
                    expect(res.body.parts.length).toBe(allTestParts.length - 1);
                })

        done();
    })

    it(`DELETE /:partObjID: User with PART_WRITE perm
        should be able to access the endpoint and delete
        a part. Part should not longer be found via
        the SUPPLIER API`, async (done) => {
        await authenticatedAdminAgent
            .delete(`${partEndpoint}/${partObjID}`)
            .expect(200)

        await authenticatedAdminAgent
            .get(`${supplierEndpoint}/${supplierObjID}`)
            .expect(200)
            .expect(res => {
                expect(res.body.parts.length).toBe(0);
            })

        done();
    })

    it(`DELETE /:partObjID: User with PART_WRITE perm
        deleting a non-existent part should still result
        in a 200 status code response`, async (done) => {
        await authenticatedAdminAgent
            .delete(`${partEndpoint}/${supplierObjID}`)
            .expect(200)

        // Nothing should have been deleted
        await authenticatedAdminAgent
            .get(partEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.parts.length).toBe(allTestParts.length);
            })
        done();
    })

    it(`DELETE /:partObjID: User with PART_WRITE perm
        deleting an already-deleted part should still result
        in a 200 status code response`, async (done) => {
        // Delete existing part
        await authenticatedAdminAgent
            .delete(`${partEndpoint}/${partObjID}`)
            .expect(200)

        // Part should have been deleted
        await authenticatedAdminAgent
            .get(partEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.parts.length).toBe(allTestParts.length - 1);
            })
        
        // Delete already-deleted part
        await authenticatedAdminAgent
            .delete(`${partEndpoint}/${partObjID}`)
            .expect(200)
        
        // No other parts should have been deleted
        await authenticatedAdminAgent
            .get(partEndpoint)
            .expect(200)
            .expect(res => {
                expect(res.body.parts.length).toBe(allTestParts.length - 1);
            })
        
        done();
    })

    it(`DELETE /:partObjID: User without PART_WRITE perm
        should not be able to access the endpoint and delete
        a part`, async (done) => {
        // With PART_READ perm
        await authenticatedReadAgent
                .delete(`${partEndpoint}/${partObjID}`)
                .send(newPartWithPrice)
                .expect(403);

        // With neither PART_READ nor PART_WRITE perm
        await authenticatedUnauthorizedAgent
                .delete(`${partEndpoint}/${partObjID}`)
                .send(newPartWithPrice)
                .expect(403);

        done();
    })

    /**
     * -------
     * General
     * -------
     */
    it(`Unauthenticated users should not be able to access
        the Part API`, async (done) => {
        // Set up part with supplierObjID
        let newPart = JSON.parse(JSON.stringify(newPartWithPrice));
        newPart.supplierObjID = supplierObjID;

        await request(server)
                .get(partEndpoint)
                .expect(401)

        await request(server)
                .get(`${partEndpoint}/${partObjID}`)
                .expect(401)

        await request(server)
                .post(partEndpoint)
                .send(newPart)
                .expect(401)

        await request(server)
                .patch(`${partEndpoint}/${partObjID}`)
                .send({
                    status: 'ARCHIVE'
                })
                .expect(401)

        await request(server)
                .delete(`${partEndpoint}/${partObjID}`)
                .expect(401)
        
        done();
    })

    
})