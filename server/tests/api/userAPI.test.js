const request = require('supertest');
const app = require('../../app');
const { UserModel } = require('../../data/database');
const { expect } = require('chai');

let testUsers = require('../../data/databaseBootstrap').users;
const { PERMS } = require('../../routes/api/v1/auth/permissions');
const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { loginEndpoint, 
        userEndpoint,
        getAuthenticatedAgent, 
        parseCookiesFromResponse } = require('./testUtils');

describe('Testing /api/v1/user endpoint', () => {
    let authenticatedAdminAgent = null;
    let authenticatedUnauthorizedAgent = null;
    let server = null;
    let dbi = null;
    
    let newAdmin = {
        "username": "newAdmin",
        "password": "newAdminPassword",
        "permissions": Object.keys(PERMS),
        "name": "Gandalf",
        "position": "Resident Wizard",
        "reportsTo": "admin"
    }

    beforeAll(async (done) => {
        // Set up Database Connection before all tests
        dbi = new DatabaseInteractor();
        await dbi.initConnection();
    
        // Set up server before all tests
        const serverPortNumber = process.env.PORT;
        server = app.listen(serverPortNumber, function() {
            done();
        })
    })
    
    afterAll((done) => {
        // Close server after all tests
        server && server.close(done);
    })

    beforeEach(async (done) => {
        // Reset Database
        await dbi.clearModelData(UserModel);
        await dbi.addUsers(...testUsers);
        
        // Login and Authenticate Admin Agent
        const admin = testUsers[0];
        authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);

        // Login and Authenticate Non-Admin Agent (no access to USERS API)
        const nonAdmin = testUsers[1];
        authenticatedUnauthorizedAgent = await getAuthenticatedAgent(server, nonAdmin.username, nonAdmin.password);
        done();
    })
    
    it("Unauthenticated user should not be able to access user API", async (done) => {
        await request(server)
                .post(userEndpoint)
                .send(newAdmin)
                .expect(401);
        
        await request(server)
                .patch(userEndpoint + `/${testUsers[0].username}`)
                .send(newAdmin)
                .expect(401);
        
        await request(server)
                .delete(userEndpoint + `/${testUsers[0].username}`)
                .expect(401);
        
        await request(server)
                .get(userEndpoint)
                .expect(401);

        await request(server)
                .get(userEndpoint + `/${testUsers[0].username}`)
                .expect(401);

        return done();
    })

    it("User with USER_WRITE perm should be able to create new user", async (done) => {
        // Create new user
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send(newAdmin)
                .expect(200)
        
        // Should be able to log in as newly created user
        await request(server)
                .post(loginEndpoint)
                .send({ username: newAdmin.username, password: newAdmin.password })
                .expect(200)
                .expect((res) => {
                    let cookies = parseCookiesFromResponse(res);
                    expect(cookies.accessToken).to.exist;
                    expect(cookies.refreshToken).to.exist;
                })
        
        return done();
    })

    it(`Newly created user should be in resource collection`, async (done) => {
        let origLength = testUsers.length;

        await authenticatedAdminAgent
                .post(userEndpoint)
                .send(newAdmin)
                .expect(200);
        
        await authenticatedAdminAgent
                .get(userEndpoint)
                .expect((res) => {
                    expect(res.body.length).to.equal(origLength + 1);
                })

        return done();
    })

    it(`User with USER_WRITE perm should not be able to 
        create new user without required fields (excluding
        permissions)`, async(done) => {
        // Missing username field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position,
                    reportsTo: newAdmin.reportsTo
                })
                .expect(400)
        
        // Missing password field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position,
                    reportsTo: newAdmin.reportsTo
                })
                .expect(400)
        
        // Missing name field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    position: newAdmin.position,
                    reportsTo: newAdmin.reportsTo
                })
                .expect(400)
        
        // Missing username field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position,
                    reportsTo: newAdmin.reportsTo
                })
                .expect(400)

        // Missing reportsTo field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position
                })
                .expect(400)

        done();
    })

    it(`User with USER_WRITE perm should be able 
        to create new user with no permissions`, async (done) => {
        // Although the permissions field is required, it
        // defaults to [], which is considered valid
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    password: newAdmin.password,
                    name: newAdmin.name,
                    position: newAdmin.position,
                    reportsTo: newAdmin.reportsTo
                })
                .expect(200);

        done();
    })

    it(`User with USER_WRITE perm should not be 
        able to re-create existing user`, async (done) => {
        // Re-create existing user
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send(testUsers[1])
                .expect(400)
                .expect((res) => {
                    expect(res.text).to.be.equal('Unable to create new user');
                })
        
        return done();
    })

    it(`User with USER_WRITE perm should be able 
        to update password of existing user`, async (done) => {
        let newPassword = "newPassword123";
        await authenticatedAdminAgent
                .patch(userEndpoint + `/${testUsers[1].username}`)
                .send({ password: newPassword })
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal('Updated User Details');
                })
        
        // User should be able to log in with new password
        await request(server)
            .post(loginEndpoint)
            .send({ username: testUsers[1].username, password: newPassword})
            .expect(200)
        
        return done();
    })

    it("User with USER_WRITE perm should be able to delete existing user", async (done) => {
        await authenticatedAdminAgent
                .delete(userEndpoint + `/${testUsers[1].username}`)
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal('Deleted User');
                })
        
        // User should no longer be able to log in
        await request(server)
            .post(loginEndpoint)
            .send({ username: testUsers[1].username, password: testUsers[1].password })
            .expect(401)
        
        return done();
    })

    it(`Deleted user should not be in resource collection`, async (done) => {
        let origLength = testUsers.length;

        await authenticatedAdminAgent
                .delete(userEndpoint + `/${testUsers[1].username}`)
                .expect(200);
        
        await authenticatedAdminAgent
                .get(userEndpoint)
                .expect((res) => {
                    expect(res.body.length).to.equal(origLength - 1);
                })

        return done();
    })

    it("User with USER_WRITE perm should be able to get list of all users", async (done) => {
        await authenticatedAdminAgent
                .get(userEndpoint)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).to.be.equal(testUsers.length);
                    expect(res.body[0].username).to.exist;
                    expect(res.body[0].permissions).to.exist;
                    expect(res.body[0].name).to.exist;
                    expect(res.body[0].position).to.exist;
                })
        
        return done();
    })

    it("User with USER_WRITE perm should be able to get single user's detail", async (done) => {
        await authenticatedAdminAgent
                .get(userEndpoint + `/${testUsers[1].username}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.username).to.equal(testUsers[1].username);
                    expect(res.body.role).to.equal(testUsers[1].role);
                })
        
        return done();
    })

    it(`User without USER_WRITE perm should not 
        be able access /api/v1/user endpoints`, async (done) => {
        await authenticatedUnauthorizedAgent
                .post(userEndpoint)
                .send(newAdmin)
                .expect(403);
        
        await authenticatedUnauthorizedAgent
                .patch(userEndpoint + `/${testUsers[0].username}`)
                .send(newAdmin)
                .expect(403);
        
        await authenticatedUnauthorizedAgent
                .delete(userEndpoint + `/${testUsers[0].username}`)
                .expect(403);
        
        await authenticatedUnauthorizedAgent
                .get(userEndpoint)
                .expect(403);

        await authenticatedUnauthorizedAgent
                .get(userEndpoint + `/${testUsers[0].username}`)
                .expect(403);

        return done();
    })
})