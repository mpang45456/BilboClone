const mongoose = require('mongoose');
const CONFIG = require('../config');
const logger = require('../utils');

const { UserModel } = require('./database');
const { users } = require('./databaseBootstrap');

/**
 * Wrapper class that encapsulates the logic
 * required to access and add new documents 
 * to the database. 
 * 
 * Note: This class is mainly used by tests
 * and by `app.js` when the application first
 * starts up (to initialise the connection
 * and possibly reset and seed the database)
 */
class DatabaseInteractor {
    constructor() {
        this.seedUsers = users;
    }

    /**
     * Initialise a connection to the database.
     * @param {boolean} resetAndSeedDatabase 
     */
    async initConnection(resetAndSeedDatabase=false) {
        mongoose.set('useCreateIndex', true);
        return mongoose
            .connect(CONFIG.DATABASE_URL, 
                    {useNewUrlParser: true, useUnifiedTopology: true})
            .then(() => {
                logger.info("Connection to MongoDB is open");
                if (resetAndSeedDatabase) {
                    this.__resetAndSeedDatabase();
                }
            }).catch((err) => {
                logger.error(`Unable to Connect to MongoDB: ${err}`);
            });
    }

    /**
     * Clears the database of data (for all 
     * the collections (e.g. User)) and seeds it
     * with some starting data. 
     * 
     * Note: Seeding is only for dev and test
     * environments
     */
    async __resetAndSeedDatabase() {
        this.clearModelData(UserModel);
        this.addUsers(...this.seedUsers);
    }

    /**
     * Close the database connection
     */
    async closeConnection() {
        await mongoose.connection.close();
    }

    /**
     * Drops the collection from the database.
     * @param {Object} model : e.g. UserModel
     */
    async clearModelData(model) {
        return model.deleteMany({});
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
}

module.exports = {
    DatabaseInteractor
}