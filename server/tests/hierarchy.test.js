const { expect } = require('chai');

const { UserHierarchyManager } = require('../routes/api/v1/user/hierarachy');
const { UserModel } = require('../data/database');
const testUsers = require('../data/databaseBootstrap').users;

describe('Testing UserHierarchyManager', () => {
    const uhm = new UserHierarchyManager();

    // TODO: Refactor
    beforeEach(async (done) => {
        console.error("here");
        await UserModel.deleteMany({});

        function addUserToDatabase(user) {
            console.error(`user.reportsTo: ${user.reportsTo}`)
            const userObj = new UserModel({ username: user.username, 
                                            permissions: user.permissions, 
                                            name: user.name, 
                                            position: user.position,
                                            reportsTo: user.reportsTo
            });
            userObj.setPassword(user.password);
            return userObj.save();
        }
        
        testUsers.forEach(async (user) => {
            try {
                await addUserToDatabase(user);
            } catch(error) {
                console.error("Error occured: " + error);
            }
        })
    })

    it('Testing getAllDirectDescendents: success', async (done) => {
        let directDescendents = await uhm.getAllDirectDescendents(testUsers[0].reportsTo);
        expect(directDescendents).to.be.an('array');
    })
})