const mongoose = require('mongoose');
const { Schema } = mongoose;

const CONFIG = require('./config');
const logger = require('./utils');

// Set Up Database Connection
mongoose.connect(CONFIG.DATABASE_URL, 
                 {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', () => logger.error("Unable to Connect to MongoDB"));
db.once('open', () => logger.info("Connection to MongoDB is Open"));

/**
 * -----------
 * USER SCHEMA
 * -----------
 */
const crypto = require('crypto');

// TODO: Update each field to specify more attributes if necessary
// TODO: Add enum to role
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



const { users } = require('./databaseBootstrap');
function resetAndSeedDatabase() {
    db.on('open', async () => {
        await UserModel.deleteMany({});
        users.forEach(user => {
            let userObj = new UserModel({ username: user.username, role: user.role });
            userObj.setPassword(user.password);
            userObj.save(function(err, userObj) {
                if (err) { logger.error(`Could not save user: ${user}`)};
            })
        })
        logger.warn('Reset and Seeded Database');
    })
}

module.exports = {
    resetAndSeedDatabase,
    UserModel
}