const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const CONFIG = require('./config');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
const accessTokenSecret = '123456';
const refreshTokenSecret = 'asdfgh';


const { UserModel } = require('./database');

const admin = new UserModel({ username: "admin", role: "admin" });
admin.setPassword("123");
admin.save(function(err, admin) {
    if (err) {
        console.log("Could not save admin");
    }
})



const { authRouter, isAuthenticated } = require('./auth/auth');
app.use('/auth', authRouter);


app.get('/test', isAuthenticated, function(req, res) {
    res.send("Accessing a protected resource!");
})

app.listen(CONFIG.PORT_NUMBER, () => {
    console.log("Server listening on Port " + CONFIG.PORT_NUMBER);
})