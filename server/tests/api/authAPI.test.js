const request = require('supertest');
const app = require('../../app');
const { UserModel } = require('../../data/database');
const { expect } = require('chai');
const cookie = require('cookie');
const { CookieAccessInfo } = require('cookiejar');

// Configure Test
let testUsers = require('../../data/databaseBootstrap').users;
const { PERMS } = require('../../auth/permissions');

let protectedEndpoint = '/test';
let loginEndpoint = '/api/v1/auth/login';
let logoutEndpoint = '/api/v1/auth/logout';
let tokenEndpoint = '/api/v1/auth/token';
let userEndpoint = '/api/v1/auth/user';
let serverPortNumber = process.env.PORT;

let authenticatedAdminAgent = null;
const accessInfo = CookieAccessInfo();
let accessToken = null;
let refreshToken = null;
let server = null;

// Helper Functions
function addUserToDatabase(user) {
    const userObj = new UserModel({ username: user.username, 
                                    permissions: user.permissions, 
                                    name: user.name, 
                                    position: user.position 
    });
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
            .post(loginEndpoint)    
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

describe('Testing /api/v1/auth/user endpoint', () => {
    let newAdmin = {
        "username": "newAdmin",
        "password": "newAdminPassword",
        "permissions": Object.keys(PERMS),
        "name": "Gandalf",
        "position": "Resident Wizard"
    }

    let newNonAdmin = {
        "username": "newUser",
        "password": "newUserPassword",
        "permissions": [PERMS.SALES_READ, PERMS.PURCHASES_READ],
        "name": "Thorin",
        "position": "Resident Dwarf"
    }

    let authenticatedUnauthorizedAgent = null;

    beforeEach(async (done) => {
        // Create non-admin agent
        const nonAdmin = testUsers[1];
        authenticatedUnauthorizedAgent = request.agent(server);
        await authenticatedUnauthorizedAgent
                .post(loginEndpoint)    
                .send({ username: nonAdmin.username, password: nonAdmin.password });
        done();
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


    it("User with USER_WRITE perm should not be able to create new user without required fields", async(done) => {
        // Missing username field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position
                })
                .expect(400)
        
                // Missing password field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    permissions: newAdmin.permissions,
                    name: newAdmin.name,
                    position: newAdmin.position
                })
                .expect(400)
        
        // Missing name field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    password: newAdmin.password,
                    permissions: newAdmin.permissions,
                    position: newAdmin.position
                })
                .expect(400)
        
        // Missing username field
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    password: newAdmin.password,
                    name: newAdmin.name,
                    position: newAdmin.position
                })
                .expect(400)

        done();
    })

    it("User with USER_WRITE perm should be able to create new user with no permissions", async (done) => {
        // Although the permissions field is required, it
        // defaults to [], which is considered valid
        await authenticatedAdminAgent
                .post(userEndpoint)
                .send({
                    username: newAdmin.username,
                    password: newAdmin.password,
                    name: newAdmin.name,
                    position: newAdmin.position
                })
                .expect(200);

        done();
    })

    it("User with USER_WRITE perm should not be able to re-create existing user", async (done) => {
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

    it("User with USER_WRITE perm should be able to update password of existing user", async (done) => {
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

    it("User with USER_WRITE perm should be able to update role of existing user", async (done) => {
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

    it("User with USER_WRITE perm should be able to delete existing user", async (done) => {
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

    it("User with USER_WRITE perm should be able to get list of all users", async (done) => {
        await authenticatedAdminAgent
                .get(userEndpoint)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).to.be.equal(2);
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

    it("Non-Admin should not be able access /api/v1/auth/user endpoints", async (done) => {
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