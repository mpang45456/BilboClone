const request = require('supertest');
const app = require('../server');
const { UserModel } = require('../database');

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

function addUserToDatabase(user) {
    const userObj = new UserModel({ username: user.username, role: user.role});
    userObj.setPassword(user.password);
    return userObj.save();
}

let authenticatedAgent = null;

beforeEach(async (done) => {
    // // Reset Database
    // UserModel.deleteMany({}, function(err) {
    //     if (err) { throw new Error(err) };
    //     let promises = [];
    //     testUsers.forEach(user => promises.push(addUserToDatabase(user)));
    //     Promise.all(promises)
    //            .then(() => done());
    // })

    // // Login
    // const res = await request.agent(app)
    //     .post('/auth/login')
    //     .send( { username: "testAdmin", password: "testAdminPassword" })
    
    // console.log(res);

    await UserModel.deleteMany({});
    console.log('deleted');
    testUsers.forEach(async (user) => {
        try {
            await addUserToDatabase(user);
        } catch(error) {
            console.error("Error occured: " + error);
        }
    })

    // try {
    //     testUsers.forEach(async (user) => await addUserToDatabase(user));
    // } catch(error) {
    //     console.log("ERROR");
    // }
    
    authenticatedAgent = request.agent(app);
    authenticatedAgent.post('/auth/login')
                      .send({ username: "testAdmin", password: "testAdminPassword" });

    console.log("HERE:" + authenticatedAgent);
    done();


    // let promises = [];
    // testUsers.forEach(user => promises.push(addUserToDatabase(user)));
    // await Promise.all(promises)
    //         .then(() => {
    //             // Invoke `.agent()` method to create a copy of SuperAgent that saves cookies
    //             authenticatedAgent = request.agent(app)
    //                           .post('/auth/login')
    //                           .send( { username: "testAdmin", password: "testAdminPassword" })
    //         })
    //         .then((res) => {
    //             console.log(res);
    //             done();
    //         })
    //         .catch((err) => console.log(err));
    // console.log("HERE: " + authenticatedAgent);
})

afterEach((done) => {
    app.close();
    done();
})




describe('Sample Test', () => {

    it("Should test that true === true", () => {
        expect(true).toBe(true);
    })

    it("Should be able to access protected resource", () => {
        authenticatedAgent.get('/protected')
                          .expect(200);

        // console.log("THERE: " + authenticatedAgent);
    })
})