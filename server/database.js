const mongoose = require('mongoose');
const { Schema } = mongoose;

const CONFIG = require('./config');

// Set Up Database Connection
mongoose.connect(CONFIG.DATABASE_URL, 
                 {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', () => console.error("ERROR: Unable to Connect to MongoDB"));
db.once('open', () => console.log("INFO: Connection to MongoDB is Open"));

/**
 * -----------
 * USER SCHEMA
 * -----------
 */
const crypto = require('crypto');

// TODO: Update each field to specify more attributes if necessary
const UserSchema = new Schema({
    username: { type: String, unique: true, index: true }, 
    hash: String,
    salt: String,
    role: String,
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