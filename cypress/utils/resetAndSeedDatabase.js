const { DatabaseInteractor } = require('../../server/data/DatabaseInteractor');
const { UserModel } = require('../../server/data/database');
const { users } = require('../../server/data/databaseBootstrap');

/*
The following code is required because Cypress does not support
using await/async syntax within its tests, making it tricky
to have fine-grained control over how the database is reset. 

The `DatabaseInteractor` class enables fine-grained control, 
but is asynchronous in nature. Hence, this code uses environment
variables to determine what collection in the database needs
to be reset and seeded. This script is included as part of the
npm scripts.

For example: 
RESET_DB_ALL=true npm run cypress:reset_db
RESET_DB_USERS=true npm run cypress:reset_db

Note: If RESET_DB_ALL is `true`, there is no need to specify
the other environment variables
*/
const dbi = new DatabaseInteractor();
(async function() {
    if (process.env.RESET_DB_ALL === 'true') {
        console.warn('Resetting ALL collections')
        await dbi.initConnection(true); //resetAndSeedDatabase boolean set to `true`
        process.exit(); // FIXME: Should be calling dbi.closeConnection() instead (but this raises an error). Situation is similar for the `process.exit()` calls below
    } else {
        await dbi.initConnection();
        if (process.env.RESET_DB_USERS === 'true') {
            console.warn('Resetting users collection');
            await dbi.clearModelData(UserModel);
            await dbi.addUsers(...users);
        }

        process.exit();
    }
})();