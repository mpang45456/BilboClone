const mongoose = require('mongoose');
const CONFIG = require('../config');
const logger = require('../utils');

const { UserModel, PartModel, SupplierModel } = require('./database');
const { users, suppliers } = require('./databaseBootstrap');

/**
 * Wrapper class that encapsulates the logic
 * required to access and add new documents 
 * to the database. 
 * 
 * Note: This class is mainly used by tests
 * and by `app.js` when the application first
 * starts up (to initialise the connection
 * and possibly reset and seed the database)
 * 
 * Note: The `__resetAndSeedDatabase` method
 * is the nuclear option that resets and seeds
 * ALL collections. For more fine-grained control
 * over deletion, use the `clearModelData`
 * method. For more fine-grained control over
 * adding data, use the respective `add<ModelName>`
 * methods.
 */
class DatabaseInteractor {
    constructor() {
        this.seedUsers = users;
        this.seedSuppliersWithParts = suppliers;
    }

    /**
     * Initialise a connection to the database.
     * @param {boolean} resetAndSeedDatabase 
     */
    async initConnection(resetAndSeedDatabase=false) {
        mongoose.set('useCreateIndex', true);
        try {
            await mongoose.connect(CONFIG.DATABASE_URL, 
                                   {useNewUrlParser: true, useUnifiedTopology: true});
            logger.info("Connection to MongoDB is open");
            if (resetAndSeedDatabase) { await this.__resetAndSeedDatabase(); }
        } catch(err) {
            logger.error(`Something went wrong while setting up the database: ${err}`);
        }

        // Set up Mongoose Connection Events Handlers
        mongoose.connection.on('error', err => {
            logger.error(`Mongoose Connection Error: ${err}`);
        })
        mongoose.connection.on('disconnected', () => {
            logger.warn('Disconnected from MongoDB');
        })
    }

    /**
     * Clears the database of data (for all 
     * the collections (e.g. User)) and seeds it
     * with some starting data. 
     * 
     * Note: Seeding is only for dev and test
     * environments
     * 
     * // TODO: This method must be updated to reflect new Schemas
     */
    async __resetAndSeedDatabase() {
        // Clear Model Data
        await this.clearModelData(UserModel);
        await this.clearModelData(SupplierModel);
        await this.clearModelData(PartModel);

        // Add Model Data
        await this.addUsers(...this.seedUsers);
        await this.addSuppliersAndParts(...this.seedSuppliersWithParts);
    }

    /**
     * Close the database connection
     * // FIXME: Calling this method in `resetAndSeedDatabase.js` in Cypress causes an error
     */
    async closeConnection() {
        await mongoose.disconnect();
    }

    /**
     * Drops the collection from the database.
     * @param {Object} model : e.g. UserModel
     */
    async clearModelData(model) {
        await model.deleteMany({});
    }

    /**
     * Add users to the database.
     * 
     * Note: Remember to spread the list
     * of users when calling this function
     * @param  {...object} users
     */
    async addUsers(...users) {
        for (let user of users) {
            let userObj = new UserModel({ username: user.username, 
                                          permissions: user.permissions, 
                                          name: user.name, 
                                          position: user.position,
                                          reportsTo: user.reportsTo });
            userObj.setPassword(user.password);
            await userObj.save();
        }
    }

    /**
     * Add suppliers and their associated parts
     * to the database. 
     * 
     * Note: each `supplierWithParts` must follow
     * the format detailed in `databaseBootstrap.js`
     * @param  {...object} suppliersWithParts 
     */
    async addSuppliersAndParts(...suppliersWithParts) {
        for (let supplier of suppliersWithParts) {
            // Add Suppliers
            let supplierDoc = new SupplierModel({
                name: supplier.name, 
                address: supplier.address,
                telephone: supplier.telephone, 
                fax: supplier.fax, 
                additionalInfo: supplier.additionalInfo
            })
            
            // Add Parts 
            for (let part of supplier.parts) {
                let partDoc = PartModel({
                    supplier: supplier.name, 
                    partNumber: part.partNumber, 
                    priceHistory: part.priceHistory, 
                    description: part.description,
                    status: part.status,
                    additionalInfo: part.additionalInfo
                })
                await partDoc.save();
                supplierDoc.parts.push(partDoc);
            }

            // Save Supplier Document after obtaining Parts reference
            await supplierDoc.save();
        }
    }
}

module.exports = {
    DatabaseInteractor
}