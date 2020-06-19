const request = require('supertest');
const app = require('../app');
const { UserModel } = require('../database');
const { expect } = require('chai');
const cookie = require('cookie');
const { CookieAccessInfo, Cookie } = require('cookiejar');

// Configure Test
const testUsers = [
    {
        "username": "testAdmin",
        "password": "testAdminPassword",
        "role": "admin"
    },
    {
        "username": "testUser",
        "password": "testUserPassword",
        "role": "user"
    }
]

let authenticatedAgent = null;
const accessInfo = CookieAccessInfo();
let accessToken = null;
let refreshToken = null;

let protectedEndpoint = '/test';
let loginEndpoint = '/auth/login';
let logoutEndpoint = '/auth/logout';
let tokenEndpoint = '/auth/token';

let serverPortNumber = 3000;
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
    authenticatedAgent = request.agent(server);
    await authenticatedAgent.post('/auth/login')
                            .send({ username: "testAdmin", password: "testAdminPassword" });
    accessToken = authenticatedAgent.jar.getCookie('accessToken', accessInfo).value;
    refreshToken = authenticatedAgent.jar.getCookie('refreshToken', accessInfo).value; 
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
    it("No tokens provided", (done) => {
        request(server)
        .post(tokenEndpoint)
        .expect(401);
        done();
    })
    
    it("Valid refresh and access tokens provided", async (done) => {
        // authenticatedAgent
        //     .post(tokenEndpoint)
        //     .expect(200)
        //     .end(function(err, res) {
        //         authenticatedAgent
        //             .get(protectedEndpoint)
        //             .expect(200)
        //     })

        await authenticatedAgent
                .post(tokenEndpoint)
                .expect(200)

        await authenticatedAgent
                .get(protectedEndpoint)
                .expect(200)
        
        return done();


            // .then((err, res) => {
            //     console.log(err)
            //     console.log(res)
            //     done();
            // })

        // authenticatedAgent.post(tokenEndpoint).expect(200).then(() => {
        //     return authenticatedAgent.get(protectedEndpoint).expect(200);
        // })
        //                   .then(() => {
        //                       authenticatedAgent
        //                   })

        // await authenticatedAgent.get(protectedEndpoint)
        //                         .expect(200);

        // done();

        // authenticatedAgent.get('/protected')
        //                   .expect(200)
        //                   .end(function() )


        // await authenticatedAgent.post(tokenEndpoint)
        //                         .expect(200);
    })

    it("Invalid refresh token and valid access token provided", (done) => {
        request(server)
            .post(tokenEndpoint)
            .set('Cookie', [`accessToken=${accessToken};refreshToken=INVALIDVALUE`])
            .expect(403);
        done();
    })

    it("Valid refresh token and invalid access token provided", (done) => {
        request(server)
            .post(tokenEndpoint)
            .set('Cookie', [`accessToken=INVALIDVALUE;refreshToken=${refreshToken}`])
            .expect(200);
        done();
    })
})

describe('Authentication Endpoint Tests', () => {
    
    it("Access Protected Resource", (done) => {
        authenticatedAgent.get(protectedEndpoint)
                          .expect(200);
        done();
    })
})