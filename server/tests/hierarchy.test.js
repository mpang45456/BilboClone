// const { expect } = require('chai');

const { UserHierarchy } = require('../routes/api/v1/user/hierarachy');
const { UserModel } = require('../data/database');
const testUsers = require('../data/databaseBootstrap').users;

const mongoose = require('mongoose');
const CONFIG = require('../config');

describe('Testing UserHierarchyManager', () => {
    beforeAll(async (done) => {
        // TODO: Refactor this code into a utils file
        await mongoose.connect(CONFIG.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})
        done();
    })

    afterAll(async (done) => {
        await mongoose.connection.close();
        done();
    })

    // TODO: Refactor
    beforeEach(async (done) => {
        await UserModel.deleteMany({});

        function addUserToDatabase(user) {
            const userObj = new UserModel({ username: user.username, 
                                            permissions: user.permissions, 
                                            name: user.name, 
                                            position: user.position,
                                            reportsTo: user.reportsTo
            });
            userObj.setPassword(user.password);
            return userObj.save();
        }
        
        for (let user of testUsers) {
            await addUserToDatabase(user);
        }

        done();
    })

    it.only('Should not be able to getAllDirectDescendents starting from root "none"', async (done) => {
        expect.assertions(1);
        try {
            await UserHierarchy.getAllDirectDescendents(testUsers[0].reportsTo)
        } catch(e) {
            expect(e.message).toMatch(/.*No such user/);
            done();
        }
    })

    it('Testing getAllDirectDescendents: Existing user with descendents', async (done) => {
        let directDescendents = await UserHierarchy.getAllDirectDescendents(testUsers[0].username);
        expect(directDescendents).to.be.an('array');
        expect(directDescendents.length).to.be.equal(2);
        expect(directDescendents).to.include(testUsers[1].username);
        expect(directDescendents).to.include(testUsers[2].username);
        expect(directDescendents).to.not.include(testUsers[3].username);
        done();
    })

    it('Testing getAllDirectDescendents: Existing user with no descendents', async (done) => {
        let directDescendents = await UserHierarchy.getAllDirectDescendents(testUsers[2].username);
        expect(directDescendents).to.be.an('array');
        expect(directDescendents.length).to.be.equal(0);
        done();
    })

    it('Testing getAllDirectDescendents: Non-existent user', async (done) => {
        let directDescendents = await UserHierarchy.getAllDirectDescendents("nonExistentUser");
        expect(directDescendents).to.be.an('array');
        expect(directDescendents.length).to.be.equal(0);
        done();
    })

    it('Testing getAllDescendents: Starting from root "none"', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents(testUsers[0].reportsTo);
        expect(allDescendents).to.be.an('array');
        expect(allDescendents.length).to.be.equal(4);
        expect(allDescendents).to.include(testUsers[0].username);
        expect(allDescendents).to.include(testUsers[1].username);
        expect(allDescendents).to.include(testUsers[2].username);
        expect(allDescendents).to.include(testUsers[3].username);
        done();
    })

    it('Testing getAllDescendents: Existing user with descendents', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents(testUsers[0].username);
        expect(allDescendents).to.be.an('array');
        expect(allDescendents.length).to.be.equal(3);
        expect(allDescendents).to.include(testUsers[1].username);
        expect(allDescendents).to.include(testUsers[2].username);
        expect(allDescendents).to.include(testUsers[3].username);
        done();
    })

    it('Testing getAllDescendents: Existing user with no descendents', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents(testUsers[2].username);
        expect(allDescendents).to.be.an('array');
        expect(allDescendents.length).to.be.equal(0);
        done();
    })

    it('Testing getAllDescendents: Non-existent user', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents("nonExistentUser");
        expect(allDescendents).to.be.an('array');
        expect(allDescendents.length).to.be.equal(0);
        done();
    })
})