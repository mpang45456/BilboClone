const request = require('supertest');
const app = require('../../app');
const { UserModel } = require('../../data/database');
const { expect } = require('chai');

// Configure Test
let testUsers = require('../../data/databaseBootstrap').users;
const { PERMS } = require('../../routes/api/v1/auth/permissions');

const { DatabaseInteractor } = require('../../data/DatabaseInteractor');
const { protectedEndpoint,
        loginEndpoint, 
        logoutEndpoint,
        tokenEndpoint,
        userEndpoint,
        getAuthenticatedAgent, 
        getCookieValueFromAgent,
        parseCookiesFromResponse } = require('./testUtils');

let authenticatedAdminAgent = null;
let accessToken = null;
let refreshToken = null;
let server = null;
let dbi = null;

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

/**
 * Although the /auth endpoint does not modify 
 * the User database, the tests should reset the 
 * User database anyway because the protected endpoint
 * being used to test successful authentication is 
 * the /user endpoint.
 */
beforeEach(async (done) => {
    // Reset Database
    await dbi.clearModelData(UserModel);
    await dbi.addUsers(...testUsers);
    
    // Login and Authenticate
    const admin = testUsers[0];
    authenticatedAdminAgent = await getAuthenticatedAgent(server, admin.username, admin.password);
    accessToken = getCookieValueFromAgent(authenticatedAdminAgent, 'accessToken');
    refreshToken = getCookieValueFromAgent(authenticatedAdminAgent, 'refreshToken');
    done();
})

afterAll((done) => {
    // Close server after all tests
    server && server.close(done);
})

// Tests
describe('Testing /api/v1/auth/login', () => {
    it("Incorrect username", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ username: "wrongUsername", password: "testAdminPassword"})
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("No username", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ password: "testAdminPassword"})
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("Incorrect password", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ username: "testAdmin", password: "wrongPassword"})
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("No password", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ username: "testAdmin" })
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("Incorrect username and password", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ username: "wrongUsername", password: "wrongPassword"})
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("No credentials provided", (done) => {
        request(server)
               .post(loginEndpoint)
               .expect(401)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }
                   expect(res.text).to.be.equal('Invalid credentials');
                   return done();
               })
    })

    it("Valid credentials provided", (done) => {
        request(server)
               .post(loginEndpoint)
               .send({ username: testUsers[0].username, 
                       password: testUsers[0].password })
               .expect(200)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }

                   let cookies = parseCookiesFromResponse(res);
                   expect(cookies.accessToken).to.exist;
                   expect(cookies.refreshToken).to.exist;
                   return done();
               })
    })
})

describe("Testing /api/v1/auth/token", () => {
    it("No tokens provided", async (done) => {
        await request(server)
                .post(tokenEndpoint)
                .expect(401);
        return done();
    })
    
    it("Valid refresh and access tokens provided", async (done) => {
        await authenticatedAdminAgent
                .post(tokenEndpoint)
                .expect(200)

        await authenticatedAdminAgent
                .get(protectedEndpoint)
                .expect(200)
        
        return done();
    })

    it("Invalid refresh token and valid access token provided", async (done) => {
        await request(server)
            .post(tokenEndpoint)
            .set('Cookie', [`accessToken=${accessToken};refreshToken=INVALIDVALUE`])
            .expect(403);
        return done();
    })

    it("Valid refresh token and invalid access token provided", async (done) => {
        await request(server)
            .post(tokenEndpoint)
            .set('Cookie', [`accessToken=INVALIDVALUE;refreshToken=${refreshToken}`])
            .expect(200);
        return done();
    })

    it("Old (invalidated) refresh token provided", async (done) => {
        // Logout to invalidate refresh token
        await authenticatedAdminAgent
                .post(logoutEndpoint)
                .expect(200);
        
        await request(server)
                .post(tokenEndpoint)
                .set('Cookie', [`accessToken=${accessToken};refreshToken=${refreshToken}`])
                .expect(403);
        
        return done();
    })
})

describe('Testing /api/v1/auth/logout', () => {
    it("Logout after authentication", async (done) => {
        await authenticatedAdminAgent
                .post(logoutEndpoint)
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal("Logout Successful");
                })
        
        return done();
    })
    
    it("Should not be able to access protected endpoints after logout", 
        async (done) => {
        // Able to access before logout
        await authenticatedAdminAgent
                .get(protectedEndpoint)
                .expect(200)
        
        await authenticatedAdminAgent
            .post(logoutEndpoint)
            .expect(200)
            .expect((res) => {
                expect(res.text).to.be.equal("Logout Successful");
            })

        // Not able to access after logout
        await authenticatedAdminAgent
                .get(protectedEndpoint)
                .expect(403)
        
        return done();
    })

    it("Should not be able to update access token after logout", 
        async (done) => {
        await authenticatedAdminAgent
            .post(logoutEndpoint)
            .expect(200)
            .expect((res) => {
                expect(res.text).to.be.equal("Logout Successful");
            })

        await authenticatedAdminAgent
                .post(tokenEndpoint)
                .expect(403)

        await authenticatedAdminAgent
                .get(protectedEndpoint)
                .expect(403)
        
        return done();
    })
})