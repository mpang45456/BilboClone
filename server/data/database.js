const mongoose = require('mongoose');
const { Schema } = mongoose;

const CONFIG = require('../config');
const logger = require('../utils');

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
 * ---------------
 * SUPPLIER SCHEMA
 * ---------------
 */
const PriceHistorySchema = new Schema({
    createdBy: { type: String, required: true },             // username
    unitPrice: { type: Number, required: true },
    additionalInfo: { type: String }
}, { timestamps: true})

const PartSchema = new Schema({
    partNumber: { type: String, required: true},
    priceHistory: [PriceHistorySchema], // TODO: Check if this defaults to an empty array
    description: { type: String },
    status: { type: String, enum: ['ARCHIVED', 'ACTIVE'], default: 'ACTIVE', required: true},
    additionalInfo: { type: String }
})

const SupplierSchema = new Schema({
    name: { type: String, required: true, unique: true},
    address: { type: String, required: true},
    telephone: { type: String },
    fax: { type: String },
    parts: [PartSchema],
    additionalInfo: { type: String }
})

const SupplierModel = mongoose.model('Supplier', SupplierSchema);
// TODO: Update DatabaseInteractor and other db code with SupplierSchema
// TODO: Trim the strings before saving

/*
This code uses the `export model pattern`, as per the Mongoose docs. 
This is acceptable as long as the code uses one connection (in this
case, the code is using the default mongoose connection). Each model 
has an associated connection. If multiple connections are used, then
the schemas should be exported, not the models.
*/
module.exports = {
    UserModel,
    SupplierModel
}