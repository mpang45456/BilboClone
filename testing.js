const mongoose = require('mongoose');
const { SupplierModel } = require('./server/data/database');
const { suppliers } = require('./server/data/databaseBootstrap');
const { DatabaseInteractor } = require('./server/data/DatabaseInteractor');

(async function() {
    const dbi = new DatabaseInteractor();
    try {
        await dbi.initConnection();
    } catch(err) {
        console.log(err);
    }

    const supplier = suppliers[0];
    let supplierObj = new SupplierModel({
        name: supplier.name,
        address: supplier.address,
        telephone: supplier.telephone,
        fax: supplier.fax, 
        parts: supplier.parts,
        additionalInfo: suppliers.additionalInfo
    })
    try {
        await supplierObj.save();
        console.log('SAVED!');
    } catch(err) {
        console.log(err);
    }

    SupplierModel.findOne({ name: "A Industries"}, async function(err, supplier) {
        if (err) {
            console.log('Find Error: ', err);
        }

        // console.log("SUPPLIER: ");
        // console.log(JSON.stringify(supplier))
        // console.log(supplier);
        if (!supplier) {
            console.log('Oops.. no supplier found');
        } else {

            // if (!Array.isArray(supplier.parts)) {
            //     supplier.parts =  [];
            // }
            supplier.parts.push({
                partNumber: 'PN122',
                priceHistory: [],
                description: 'An Allen Key', // Did not add `status` field
                additionalInfo: 'NIL'
            })
            await supplier.save();

            // let part1 = supplier.parts.filter(part => {
            //     part.partNumber === 'PN122'
            // });
            // console.log(part1);
            // console.log(supplier.parts);
            // console.log('Part: ', part);
            // console.log(typeof part);

            // if (!Array.isArray(part.priceHistory)) {
            //     part.priceHistory = [];
            // }
            // part = supplier.parts[0];
            // part.priceHistory.push({
            //     createdBy: 'brian',
            //     unitPrice: 0.011111,
            //     additionalInfo: 'cool beans'
            // })
            // console.log(supplier);
            // await supplier.save();
        }
    })

    SupplierModel.findOne({ 'parts.partNumber': 'PN121' }, async function(err, supplier) {
        if (err) {
            console.log(err);
        }

        if (!supplier) {
            console.log("hmm supplier not found");
        }

        console.log(supplier.parts)
        console.log(typeof supplier.parts);
        console.log(Array.isArray(supplier.parts));

        // console.log(supplier);
        // // if (!Array.isArray(supplier.parts.priceHistory)) {
        // //     console.log('not an array')
        // //     supplier.parts.partHistory = [];
        // // }

        // supplier.parts[0].priceHistory.push({
        //     createdBy: 'brian',
        //     unitPrice: 0.00001,
        //     additionalInfo: "Yoohoo!"
        // })

        // console.log(supplier);
        // await supplier.save();
    })


    // dbi.closeConnection();
})();
