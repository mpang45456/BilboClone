const mongoose = require('mongoose');
const { Schema } = mongoose;

const CONFIG = require('../config');
const logger = require('../utils');
const { SO_STATES, PO_STATES } = require('./databaseEnum');

/**
 * ----------------------
 * ORDER NUMBER GENERATOR
 * ----------------------
 */
const CounterSchema = new Schema({
    counterName: { type: String, required: true },
    sequenceValue: { type: Number, required: true }
})
const CounterModel = mongoose.model('Counter', CounterSchema);

/**
 * Generates and returns next order number.
 * 
 * 1. Obtains the sequence value for order number using 
 * `Counter` collection, and updates the sequence value
 * in-place. 
 * 2. Adds prefix `SO-` (for sales orders) or 
 * `PO-` (for purchase orders)
 * 3. Pads with leading zeros (6 digits total)
 * 
 * Returns order number of this form: `SO-000123`
 * 
 * @param {String} counterName : one of ['salesOrder', 'purchaseOrder']
 */
async function getNextOrderNumber(counterName) {
    const filter = { counterName };
    const update = { $inc: { sequenceValue: 1 } };
    const options = { new: true }; // returns doc AFTER `update` is applied
    const counterDoc = await CounterModel.findOneAndUpdate(filter, update, options);
    
    let prefix = null;
    switch (counterName) {
        case 'salesOrder':
            prefix = 'SO-';
            break;
        case 'purchaseOrder':
            prefix = 'PO-';
            break;
        default:
            throw new Error(`Invalid counterName: ${counterName}`);
    }
    
    // Pad with leading zeros (6 digits in total)
    // FIXME: This means that there is an upper-bound of 999999 number of orders
    const suffix = ('000000' + counterDoc.sequenceValue).slice(-6);
    return prefix + suffix;
}

/**
 * -----------
 * USER SCHEMA
 * -----------
 */
const crypto = require('crypto');
const { PermissionsTransformer } = require('../routes/api/v1/auth/permissions');
const pt = new PermissionsTransformer();
const UserSchema = new Schema({
    username: { type: String, unique: true, index: true, required: true }, 
    hash: { type: String },
    salt: { type: String },
    permissions: {
        type: [String],
        validate: {
            validator: (v) => pt.isValidPermissions(v),
            message: props => `${props.value} is not a valid permission set`
        }, 
        required: true
    },
    name: { type: String, required: true }, 
    position: { type: String, required: true },
    reportsTo: { type: String, required: true }
})

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.isValidPassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

const UserModel = mongoose.model('User', UserSchema);

/**
 * -----------
 * PART SCHEMA
 * -----------
 */
const PriceHistorySchema = new Schema({
    createdBy: { type: String, required: true }, // User.username
    unitPrice: { type: Number, required: true },
    additionalInfo: { type: String }
}, { timestamps: true}) // Has `createdAt` and `updatedAt` fields

const PartSchema = new Schema({
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    partNumber: { type: String, required: true, index: true},
    priceHistory: [PriceHistorySchema],
    description: { type: String, default: '' },
    status: { type: String, 
              enum: ['ARCHIVED', 'ACTIVE'], 
              default: 'ACTIVE', 
              required: true },
    additionalInfo: { type: String, default: '' }
})

const PartModel = mongoose.model('Part', PartSchema);

/**
 * ---------------
 * SUPPLIER SCHEMA
 * ---------------
 */
const SupplierSchema = new Schema({
    name: { type: String, required: true, unique: true, index: true },
    address: { type: String, default: '' },
    telephone: { type: String, default: '' },
    fax: { type: String, default: '' },
    parts: [{ type: Schema.Types.ObjectId, ref: 'Part'}], // Must be carefully kept in sync with PartModel
    additionalInfo: { type: String, default: ''}
})

const SupplierModel = mongoose.model('Supplier', SupplierSchema);

// TODO: Update DatabaseInteractor and databaseBootstrap.js for CustomerSchema
/**
 * ---------------
 * CUSTOMER SCHEMA
 * ---------------
 */
const CustomerSchema = new Schema({
    name: { type: String, required: true, unique: true, index: true },
    address: { type: String, default: ''},
    telephone: { type: String, default: ''},
    fax: { type: String, default: '' },
    email: { type: String, default: ''},
    pointOfContact: { type: String, required: true },
    additionalInfo: { type: String, default: ''}
})

const CustomerModel = mongoose.model('Customer', CustomerSchema);

/**
 * ------------------
 * SALES ORDER SCHEMA
 * ------------------
 * 
 * // TODO: Update docs on how SalesOrderSchema uses populate,
 * but the rest are just subdocuments
 */
const SalesOrderPartFulfillmentSchema = new Schema({
    purchaseOrder: { type: Schema.Types.ObjectId, 
                     ref: 'PurchaseOrder', 
                     required: true },
    quantity: { type: Number, required: true }
})
const SalesOrderPartInfoSchema = new Schema({
    part: { type: Schema.Types.ObjectId, 
            ref: 'Part', 
            required: true},
    quantity: { type: Number, required: true },
    additionalInfo: { type: String, default: true },
    fulfilledBy: [SalesOrderPartFulfillmentSchema]
})
const SalesOrderStateSchema = new Schema({
    status: { type: String, 
              required: true,
              enum: Object.keys(SO_STATES) },
    additionalInfo: { type: String, default: '' },
    parts: [SalesOrderPartInfoSchema]
}, { timestamps: true })
const SalesOrderSchema = new Schema({
    createdBy: { type: String, required: true, index: true }, // User.username
    orderNumber: { type: String, required: true, unique: true, index: true },
    latestStatus: { type: String, 
                    required: true,
                    enum: Object.keys(SO_STATES) },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    additionalInfo: { type: String, default: '' },
    orders: [{ type: Schema.Types.ObjectId, ref: 'SalesOrderState' }]
}, { timestamps: true })
// Used in dev/prod env. Test env will set orderNumber manually.
SalesOrderSchema.methods.setOrderNumber = async function() {
    this.orderNumber = await getNextOrderNumber('salesOrder');
}

const SalesOrderStateModel = mongoose.model('SalesOrderState', SalesOrderStateSchema);
const SalesOrderModel = mongoose.model('SalesOrder', SalesOrderSchema);

/**
 * ---------------------
 * PURCHASE ORDER SCHEMA
 * ---------------------
 */
const PurchaseOrderPartFulfillmentSchema = new Schema({
    salesOrder: { type: Schema.Types.ObjectId,
                  ref: 'SalesOrder', 
                  required: true },
    quantity: { type: Number, required: true }
})
const PurchaseOrderPartInfoSchema = new Schema({
    part: { type: Schema.Types.ObjectId,
            ref: 'Part',
            required: true },
    quantity: { type: Number, required: true },
    additionalInfo: { type: String, default: true },
    fulfilledFor: [PurchaseOrderPartFulfillmentSchema]
})
const PurchaseOrderStateSchema = new Schema({
    status: { type: String, 
              required: true,
              enum: Object.keys(PO_STATES)},
    additionalInfo: { type: String, default: '' },
    parts: [PurchaseOrderPartInfoSchema]
}, { timestamps: true })
const PurchaseOrderSchema = new Schema({
    createdBy: { type: String, required: true, index: true }, // User.username
    orderNumber: { type: String, required: true, unique: true, index: true },
    latestStatus: { type: String, 
                    required: true,
                    enum: Object.keys(PO_STATES) },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    additionalInfo: { type: String, default: '' },
    orders: [{ type: Schema.Types.ObjectId, ref: 'PurchaseOrderState' }]
}, { timestamps: true })
// Used in dev/prod env. Test env will set orderNumber manually.
PurchaseOrderSchema.methods.setOrderNumber = async function() {
    this.orderNumber = await getNextOrderNumber('purchaseOrder');
}

const PurchaseOrderStateModel = mongoose.model('PurchaseOrderState', PurchaseOrderStateSchema);
const PurchaseOrderModel = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

/*
This code uses the `export model pattern`, as per the Mongoose docs. 
This is acceptable as long as the code uses one connection (in this
case, the code is using the default mongoose connection). Each model 
has an associated connection. If multiple connections are used, then
the schemas should be exported, not the models.
*/
module.exports = {
    UserModel,
    SupplierModel,
    PartModel,
    CustomerModel,
    SalesOrderStateModel,
    SalesOrderModel,
    PurchaseOrderStateModel, 
    PurchaseOrderModel,
    CounterModel,
    getNextOrderNumber,
}