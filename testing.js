const mongoose = require('mongoose');
const { SupplierModel, 
        PartModel, 
        SalesOrderStateModel, 
        SalesOrderModel, 
        PurchaseOrderStateModel, 
        PurchaseOrderModel } = require('./server/data/database');
const { suppliers, salesOrders } = require('./server/data/databaseBootstrap');
const { DatabaseInteractor } = require('./server/data/DatabaseInteractor');
const { SO_STATES, PO_STATES } = require('./server/data/databaseEnum');

(async function() {
    let dbi = new DatabaseInteractor();
    await dbi.initConnection(true);

    // This works
    // const latestState = await SalesOrderModel.findOne({}).select({ 'orders': { '$slice': -1 }}).exec();
    // console.log(latestState);

    // Check initial latest state
    let salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001'})
    let latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] });
    console.log("------------- LATEST STATE -------------");
    console.log(latestSOStateDoc);

    // Populate Sales Order with Allocation (simulate user's allocation)
    let purchaseOrderDoc1 = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    let purchaseOrderDoc2 = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000002' });
    latestSOStateDoc._doc._id = mongoose.Types.ObjectId();
    latestSOStateDoc.isNew = true;
    // latestSOStateDoc.parts.map(partInfo => {
    //     partInfo.fulfilledBy.push({
    //         purchaseOrder: purchaseOrderDoc._id,
    //         quantity: partInfo.quantity,
    //     })
    // })
    latestSOStateDoc.parts[0].fulfilledBy.push({
        purchaseOrder: purchaseOrderDoc1._id,
        quantity: latestSOStateDoc.parts[0].quantity,
    })
    latestSOStateDoc.parts[1].fulfilledBy.push({
        purchaseOrder: purchaseOrderDoc1._id,
        quantity: latestSOStateDoc.parts[1].quantity,
    })
    latestSOStateDoc.parts[2].fulfilledBy.push({
        purchaseOrder: purchaseOrderDoc2._id,
        quantity: latestSOStateDoc.parts[2].quantity,
    })
    await latestSOStateDoc.save();
    salesOrderDoc.orders.push(latestSOStateDoc);
    await salesOrderDoc.save();
    salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001'});
    latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] });
    console.log("------------- LATEST STATE -------------");
    console.log(JSON.stringify(latestSOStateDoc, null, 2));

    // Populate Purchase Order with Allocation (clean slate, no reversion necessary)
    salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001'});
    latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] }); // In the backend, this data comes in via request body
    await Promise.all(latestSOStateDoc.parts.map(async soPartInfo => {
        for (let fulfilledByTarget of soPartInfo.fulfilledBy) {
            let purchaseOrderDocInner = await PurchaseOrderModel.findOne({ _id: fulfilledByTarget.purchaseOrder._id });
            // console.log(purchaseOrderDocInner);
            let latestPOStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDocInner.orders[purchaseOrderDocInner.orders.length - 1] });
            // console.log(latestPOStateDoc);
            let index = latestPOStateDoc.parts.findIndex(poPartInfo => {
                // console.log("------------- PO PART INFO -------------");
                // console.log(poPartInfo);
                // console.log("------------- SO PART INFO -------------");
                // console.log(soPartInfo)
                // console.log(`******** VALUE: ${String(poPartInfo.part) === String(soPartInfo.part)}`);
                return String(poPartInfo.part) === String(soPartInfo.part);
            })// TODO: check not undefined
            // TODO: Change to updateCall
            latestPOStateDoc.parts[index].fulfilledFor.push({
                salesOrder: salesOrderDoc._id,
                quantity: fulfilledByTarget.quantity,
            })
            await latestPOStateDoc.save();
        }
    }))

    purchaseOrderDoc2 = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    let latestPOStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc2.orders[purchaseOrderDoc2.orders.length - 1] });
    console.log("------------- LATEST PO STATE -------------");
    console.log(JSON.stringify(latestPOStateDoc, null, 2));

    // Perform Reversion (based on SO state)
    salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001'});
    latestSOStateDoc = await SalesOrderStateModel.findOne({ _id: salesOrderDoc.orders[salesOrderDoc.orders.length - 1] }); // In the backend, this data comes in via request body
    // Find the POs that the SO uses
    let allPOs = latestSOStateDoc.parts.map(partInfo => {
        return partInfo.fulfilledBy.map(fulfilledByTarget => String(fulfilledByTarget.purchaseOrder));
    }).flat();
    let allUniquePOs = Array.from(new Set(allPOs));
    for (let poObjID of allUniquePOs) {
        let poDoc = await PurchaseOrderModel.findOne({ _id: poObjID });
        // console.log('PODOC');
        // console.log(poDoc);
        let poDocLatestState = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1]});
        poDocLatestState.parts.map(partInfo => {
            partInfo.fulfilledFor = partInfo.fulfilledFor.filter(fulfilledForTarget => {
                String(fulfilledForTarget.salesOrder) !== String(salesOrderDoc._id);
            })
        })
        // for (let i = 0; i < poDocLatestState.parts.length; i++) {
        //     let index = poDocLatestState.parts[i].fulfilledFor.findIndex(fulfilledForTarget => String(fulfilledForTarget.purchaseOrder) === String(poDoc._id));
        //     if (index > -1) {
        //         poDocLatestState.parts[i].fulfilledFor.splice(index, 1);
        //     }
        // }
        await poDocLatestState.save();
    }
    purchaseOrderDoc2 = await PurchaseOrderModel.findOne({ orderNumber: 'PO-000001' });
    latestPOStateDoc = await PurchaseOrderStateModel.findOne({ _id: purchaseOrderDoc2.orders[purchaseOrderDoc2.orders.length - 1] });
    console.log("------------- LATEST PO STATE (AFTER REVERSION) -------------");
    console.log(JSON.stringify(latestPOStateDoc, null, 2));


    // Find latest SO state --> if confirmed --> perform reversion
    //                      --> not confirmed --> proceed to perform allocation
    // Get Purchase Order
    // let purchaseOrderDoc = await PurchaseOrderModel.findOne({});

    // // Populate with Purchase Order for Allocation
    // salesOrderDoc.orders[salesOrderDoc.orders.length - 1].parts.map(partInfo => {
    //     partInfo.fulfilledBy.push({
    //         purchaseOrder: purchaseOrderDoc._id,
    //         quantity: partInfo.quantity,
    //     })
    // })
    // console.log(salesOrderDoc.orders[salesOrderDoc.orders.length - 1].parts);
    // await salesOrderDoc.save();
    // salesOrderDoc = await SalesOrderModel.findOne({ orderNumber: 'SO-000001'})
    //                                      .populate('orders');
    // console.log("------------- STARTING OUT -------------");
    // console.log(salesOrderDoc.orders[salesOrderDoc.orders.length - 1]);


    

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
