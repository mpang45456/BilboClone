const request = require('supertest');
const app = require('../app');
const { UserModel } = require('../database');
const { expect } = require('chai');
const cookie = require('cookie');
const { CookieAccessInfo } = require('cookiejar');

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
let protectedEndpoint = '/protected';
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
    done();
})

afterAll((done) => {
    // Close server after all tests
    server && server.close(done);
})

// Tests
describe('Testing /auth/login', () => {
    let endpoint = '/auth/login';
    
    it("Incorrect username", (done) => {
        request(server)
               .post(endpoint)
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
               .post(endpoint)
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
               .post(endpoint)
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
               .post(endpoint)
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
               .post(endpoint)
               .send({ username: testUsers[0].username, 
                       password: testUsers[0].password })
               .expect(200)
               .end((err, res) => {
                   if (err) {
                       return done(err);
                   }

                   console.log(typeof res); //FIXME:
                   let cookies = parseCookiesFromResponse(res);
                   expect(cookies.accessToken).to.exist;
                   expect(cookies.refreshToken).to.exist;
                   return done();
               })
    })
})

describe("Testing /auth/token", () => {
    let endpoint = '/auth/token';
    
    it("Valid refresh token provided", (done) => {
        let accessInfo = CookieAccessInfo();
        const accessToken = authenticatedAgent.jar.getCookie("accessToken", accessInfo).value;
        const refreshToken = authenticatedAgent.jar.getCookie("refreshToken", accessInfo).value;

        authenticatedAgent.post(endpoint)
                          .expect(200)
                          .end((err, res) => {
                              if (err) {
                                  return done(err);
                              }
                            
                              let cookies = parseCookiesFromResponse(res);
                              expect(cookies.accessToken).not.equal(accessToken);
                              expect(cookies.refreshToken).to.equal(refreshToken);
                              return done();
                          })
    })
})

describe('Authentication Endpoint Tests', () => {
    
    it("Access Protected Resource", (done) => {
        authenticatedAgent.get(protectedEndpoint)
                          .expect(200);
        done();
    })
})