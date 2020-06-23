const request = require('supertest');
const app = require('../app');
const { UserModel } = require('../database');
const { expect } = require('chai');
const cookie = require('cookie');
const { CookieAccessInfo, Cookie } = require('cookiejar');

// Configure Test
let testUsers = require('../databaseBootstrap').users;

let protectedEndpoint = '/test';
let loginEndpoint = '/auth/login';
let logoutEndpoint = '/auth/logout';
let tokenEndpoint = '/auth/token';
let userEndpoint = '/auth/user';
let serverPortNumber = process.env.PORT;

let authenticatedAdminAgent = null;
const accessInfo = CookieAccessInfo();
let accessToken = null;
let refreshToken = null;
let server = null;

// Helper Functions
function addUserToDatabase(user) {
    const userObj = new UserModel({ username: user.username, role: user.role});
    userObj.setPassword(user.password);
    return userObj.save();
}

/**
 * Returns JSON object after parsing cookies in 
 * `res`'s header
 * 
 * The alternative method of retrieving the cookies
 * is to obtain them via the `getCookie` method
 * in `supertest.agent.jar`.
 * @param {Object} res 
 */
function parseCookiesFromResponse(res) {
    return cookie.parse(res.header['set-cookie'].join('; '));
}

beforeAll(async (done) => {
    // Set up server before all tests
    server = app.listen(serverPortNumber, function() {
        done();
    })
})

beforeEach(async (done) => {
    // Reset Database
    await UserModel.deleteMany({});
    testUsers.forEach(async (user) => {
        try {
            await addUserToDatabase(user);
        } catch(error) {
            console.error("Error occured: " + error);
        }
    })
    
    // Login and Authenticate
    const admin = testUsers[0];
    authenticatedAdminAgent = request.agent(server);
    await authenticatedAdminAgent
            .post('/auth/login')    
            .send({ username: admin.username, password: admin.password });
    accessToken = authenticatedAdminAgent.jar.getCookie('accessToken', accessInfo).value;
    refreshToken = authenticatedAdminAgent.jar.getCookie('refreshToken', accessInfo).value; 
    done();
})

afterAll((done) => {
    // Close server after all tests
    server && server.close(done);
})

// Tests
describe('Testing /auth/login', () => {
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

describe("Testing /auth/token", () => {
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
})

describe('Testing /auth/logout', () => {
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
        await authenticatedAdminAgent
            .post(logoutEndpoint)
            .expect(200)
            .expect((res) => {
                expect(res.text).to.be.equal("Logout Successful");
            })

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

describe('Testing /auth/user endpoint', () => {
    let newAdmin = {
        "username": "newAdmin",
        "password": "newAdminPassword",
        "role": "admin"
    }

    let authenticatedNonAdminAgent = null;

    beforeEach(async (done) => {
        // Create non-admin agent
        const nonAdmin = testUsers[1];
        authenticatedNonAdminAgent = request.agent(server);
        await authenticatedNonAdminAgent
                .post('/auth/login')    
                .send({ username: nonAdmin.username, password: nonAdmin.password });
        done();
    })

    it("Admin should be able to create new user", async (done) => {
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

    it("Admin should not be able to re-create existing user", async (done) => {
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

    it("Admin should be able to update password of existing user", async (done) => {
        let newPassword = "newPassword123";
        await authenticatedAdminAgent
                .patch(userEndpoint + `/${testUsers[1].username}`)
                .send({ password: newPassword })
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal('Updated User Details');
                })
        
        // User should be able to log in with new password
        request(server)
            .post(loginEndpoint)
            .send({ username: testUsers[1].user, password: newPassword})
            .expect(200)
        
        return done();
    })

    it("Admin should be able to update role of existing user", async (done) => {
        let newRole = "admin";
        await authenticatedAdminAgent
                .patch(userEndpoint + `/${testUsers[1].username}`)
                .send({ role: newRole })
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal('Updated User Details');
                })
        
        return done();
    })

    it("Admin should be able to delete existing user", async (done) => {
        await authenticatedAdminAgent
                .delete(userEndpoint + `/${testUsers[1].username}`)
                .expect(200)
                .expect((res) => {
                    expect(res.text).to.be.equal('Deleted User');
                })
        
        // User should no longer be able to log in
        request(server)
            .post(loginEndpoint)
            .send({ username: testUsers[1].user, password: testUsers[1].password })
            .expect(200)
        
        return done();
    })

    it("Admin should be able to get list of all users", async (done) => {
        await authenticatedAdminAgent
                .get(userEndpoint)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).to.be.equal(2);
                    expect(res.body[0].username).to.exist;
                    expect(res.body[0].role).to.exist;
                })
        
        return done();
    })

    it("Admin should be able to get single user's detail", async (done) => {
        await authenticatedAdminAgent
                .get(userEndpoint + `/${testUsers[1].username}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.username).to.equal(testUsers[1].username);
                    expect(res.body.role).to.equal(testUsers[1].role);
                })
        
        return done();
    })

    it("Non-Admin should not be able access /auth/user endpoints", async (done) => {
        await authenticatedNonAdminAgent
                .post(userEndpoint)
                .send(newAdmin)
                .expect(403);
        
        await authenticatedNonAdminAgent
                .patch(userEndpoint + `/${testUsers[0].username}`)
                .send(newAdmin)
                .expect(403);
        
        await authenticatedNonAdminAgent
                .delete(userEndpoint + `/${testUsers[0].username}`)
                .expect(403);
        
        await authenticatedNonAdminAgent
                .get(userEndpoint)
                .expect(403);

        await authenticatedNonAdminAgent
                .get(userEndpoint + `/${testUsers[0].username}`)
                .expect(403);

        return done();
    })
})