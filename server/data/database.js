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

module.exports = {
    UserModel
}