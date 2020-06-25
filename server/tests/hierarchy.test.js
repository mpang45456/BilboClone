const { UserHierarchy } = require('../routes/api/v1/user/hierarachy');
const { UserModel } = require('../data/database');
const { DatabaseInteractor } = require('../data/DatabaseInteractor');
const testUsers = require('../data/databaseBootstrap').users;

describe('Testing UserHierarchy', () => {
    let dbi = null; //DatabaseInteractor
    
    beforeAll(async (done) => {
        dbi = new DatabaseInteractor();
        await dbi.initConnection();
        done();
    })

    afterAll(async (done) => {
        await dbi.closeConnection();
        done();
    })

    beforeEach(async (done) => {
        await dbi.clearModelData(UserModel);
        await dbi.addUsers(...testUsers);
        done();
    })

    it('Should not be able to getAllDirectDescendents starting from root "none"', async (done) => {
        expect.assertions(1);
        try {
            await UserHierarchy.getAllDirectDescendents(testUsers[0].reportsTo);
        } catch(e) {
            expect(e.message).toMatch(/.*No such user/);
            done();
        }
    })

    it('Testing getAllDirectDescendents: Existing user with descendents', async (done) => {
        let directDescendents = await UserHierarchy.getAllDirectDescendents(testUsers[0].username);
        expect(Array.isArray(directDescendents)).toBeTruthy();
        expect(directDescendents.length).toBe(2);
        expect(directDescendents).toContain(testUsers[1].username);
        expect(directDescendents).toContain(testUsers[2].username);
        expect(directDescendents).not.toContain(testUsers[3].username);
        done();
    })

    it('Testing getAllDirectDescendents: Existing user with no descendents', async (done) => {
        let directDescendents = await UserHierarchy.getAllDirectDescendents(testUsers[2].username);
        expect(Array.isArray(directDescendents)).toBeTruthy();
        expect(directDescendents.length).toBe(0);
        done();
    })

    it('Should not be able to getAllDirectDescendents for non-existent user', async (done) => {
        expect.assertions(1);
        try {
            await UserHierarchy.getAllDirectDescendents("nonExistentUser");
        } catch(e) {
            expect(e.message).toMatch(/.*No such user/);
            done();
        }
    })

    it('Testing getAllDescendents: Starting from root "none"', async (done) => {
        expect.assertions(1);
        try {
            await UserHierarchy.getAllDescendents(testUsers[0].reportsTo);
        } catch(e) {
            expect(e.message).toMatch(/.*No such user/);
            done();
        }
    })

    it('Testing getAllDescendents: Existing user with descendents', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents(testUsers[0].username);
        expect(Array.isArray(allDescendents)).toBeTruthy();
        expect(allDescendents.length).toBe(3);
        expect(allDescendents).toContain(testUsers[1].username);
        expect(allDescendents).toContain(testUsers[2].username);
        expect(allDescendents).toContain(testUsers[3].username);
        done();
    })

    it('Testing getAllDescendents: Existing user with no descendents', async (done) => {
        let allDescendents = await UserHierarchy.getAllDescendents(testUsers[2].username);
        expect(Array.isArray(allDescendents)).toBeTruthy();
        expect(allDescendents.length).toBe(0);
        done();
    })

    it('Testing getAllDescendents: Non-existent user', async (done) => {
        expect.assertions(1);
        try {
            await UserHierarchy.getAllDescendents("nonExistentUser");
        } catch(e) {
            expect(e.message).toMatch(/.*No such user/);
            done();
        }
    })
})