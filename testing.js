const mongoose = require('mongoose');
const { SupplierModel, 
        PartModel, 
        SalesOrderStateModel, 
        SalesOrderModel, 
        PurchaseOrderStateModel, 
        PurchaseOrderModel } = require('./server/data/database');
const { suppliers, salesOrders } = require('./server/data/databaseBootstrap');
const { DatabaseInteractor } = require('./server/data/DatabaseInteractor');

(async function() {
    let dbi = new DatabaseInteractor();
    await dbi.initConnection(true);

    // Populate Database with Sales Orders
    // await dbi.addSuppliersAndParts(...suppliers);
    // await dbi.addSalesOrders(...salesOrders);
    
    // // Create New Supplier Document and Save
    // const supplier = suppliers[0];
    // let supplierObj = new SupplierModel({
    //     name: supplier.name, 
    //     address: supplier.address, 
    //     telephone: supplier.telephone,
    //     fax: supplier.fax,
    //     additionalInfo: supplier.additionalInfo
    // })

    // await supplierObj.save();
    // console.log("Supplier Has Been Saved!");

    // // Create New Part Document and Save
    // const part = supplier.parts[0];
    // let partObj = PartModel({
    //     supplier: supplier.name, 
    //     partNumber: part.partNumber,
    //     priceHistory: part.priceHistory,
    //     description: part.description,
    //     additionalInfo: part.additionalInfo
    // })
    // // Update Supplier with New Part
    // supplierObj = await SupplierModel.findOne({ name: supplier.name }).populate('parts');
    // supplierObj.parts.push(partObj);

    // await partObj.save();
    // await supplierObj.save();

    // // Update Price of a Particular Part
    // let updatePartObj = await PartModel.findOne({ supplier: supplier.name, partNumber: part.partNumber});
    // updatePartObj.priceHistory.push({ createdBy: 'Brian', unitPrice: 0.0002, additionalInfo: 'Expensive Product'});
    // await updatePartObj.save();

    // // Delete Part in Supplier
    // partObj = await PartModel.findOne({ supplier: supplier.name, partNumber: part.partNumber});
    // await SupplierModel.findOneAndUpdate({ name: supplier.name }, { $pull: {parts: partObj._id }});



    await dbi.closeConnection();
})();
























// (async function() {
//     let dbi = new DatabaseInteractor();
//     await dbi.initConnection();

//     // Create New Supplier Document and Save
//     const supplier = suppliers[0];
//     let supplierObj = new SupplierModel({
//         name: supplier.name, 
//         address: supplier.address, 
//         telephone: supplier.telephone,
//         fax: supplier.fax,
//         additionalInfo: supplier.additionalInfo
//     })

//     await supplierObj.save();
//     console.log("Supplier Has Been Saved!");

//     // Create New Part Document and Save
//     const part = supplier.parts[0];
//     let partObj = PartModel({
//         supplier: supplier.name, 
//         partNumber: part.partNumber,
//         priceHistory: part.priceHistory,
//         description: part.description,
//         additionalInfo: part.additionalInfo
//     })
//     // Update Supplier with New Part
//     supplierObj = await SupplierModel.findOne({ name: supplier.name }).populate('parts');
//     supplierObj.parts.push(partObj);

//     await partObj.save();
//     await supplierObj.save();

//     // Update Price of a Particular Part
//     let updatePartObj = await PartModel.findOne({ supplier: supplier.name, partNumber: part.partNumber});
//     updatePartObj.priceHistory.push({ createdBy: 'Brian', unitPrice: 0.0002, additionalInfo: 'Expensive Product'});
//     await updatePartObj.save();

//     // Delete Part in Supplier
//     partObj = await PartModel.findOne({ supplier: supplier.name, partNumber: part.partNumber});
//     await SupplierModel.findOneAndUpdate({ name: supplier.name }, { $pull: {parts: partObj._id }});



//     await dbi.closeConnection();
// })();



/**
 * 
 * Actions necessary:
 * - Create new supplier with information (no parts added yet)
 * - Get supplier information (with no parts)
 * - Get supplier information (with parts) ==> is this necessary?
 * - Edit supplier information (do not allow a change of the name?)
 * - Delete supplier information ==> must be able to delete the parts as well
 * 
 * - Create a new part and associate it with a particular supplier (with price)
 * - Create a new part and associate it with a particular supplier (without price)
 * - Update price of a part (i.e. append to price history)
 * - Get all parts associated with a particular supplier
 * 
 */














// (async function() {
//     const dbi = new DatabaseInteractor();
//     try {
//         await dbi.initConnection();
//     } catch(err) {
//         console.log(err);
//     }

//     const supplier = suppliers[0];
//     let supplierObj = new SupplierModel({
//         name: supplier.name,
//         address: supplier.address,
//         telephone: supplier.telephone,
//         fax: supplier.fax, 
//         parts: supplier.parts,
//         additionalInfo: suppliers.additionalInfo
//     })
//     try {
//         await supplierObj.save();
//         console.log('SAVED!');
//     } catch(err) {
//         console.log(err);
//     }

//     SupplierModel.findOne({ name: "A Industries"}, async function(err, supplier) {
//         if (err) {
//             console.log('Find Error: ', err);
//         }

//         // console.log("SUPPLIER: ");
//         // console.log(JSON.stringify(supplier))
//         // console.log(supplier);
//         if (!supplier) {
//             console.log('Oops.. no supplier found');
//         } else {

//             // if (!Array.isArray(supplier.parts)) {
//             //     supplier.parts =  [];
//             // }
//             supplier.parts.push({
//                 partNumber: 'PN122',
//                 priceHistory: [],
//                 description: 'An Allen Key', // Did not add `status` field
//                 additionalInfo: 'NIL'
//             })
//             await supplier.save();

//             // let part1 = supplier.parts.filter(part => {
//             //     part.partNumber === 'PN122'
//             // });
//             // console.log(part1);
//             // console.log(supplier.parts);
//             // console.log('Part: ', part);
//             // console.log(typeof part);

//             // if (!Array.isArray(part.priceHistory)) {
//             //     part.priceHistory = [];
//             // }
//             // part = supplier.parts[0];
//             // part.priceHistory.push({
//             //     createdBy: 'brian',
//             //     unitPrice: 0.011111,
//             //     additionalInfo: 'cool beans'
//             // })
//             // console.log(supplier);
//             // await supplier.save();
//         }
//     })

//     SupplierModel.findOne({ 'parts.partNumber': 'PN121' }, async function(err, supplier) {
//         if (err) {
//             console.log(err);
//         }

//         if (!supplier) {
//             console.log("hmm supplier not found");
//         }

//         console.log(supplier.parts)
//         console.log(typeof supplier.parts);
//         console.log(Array.isArray(supplier.parts));

//         // console.log(supplier);
//         // // if (!Array.isArray(supplier.parts.priceHistory)) {
//         // //     console.log('not an array')
//         // //     supplier.parts.partHistory = [];
//         // // }

//         // supplier.parts[0].priceHistory.push({
//         //     createdBy: 'brian',
//         //     unitPrice: 0.00001,
//         //     additionalInfo: "Yoohoo!"
//         // })

//         // console.log(supplier);
//         // await supplier.save();
//     })


//     // dbi.closeConnection();
// })();
