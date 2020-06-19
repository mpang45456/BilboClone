const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const CONFIG = require('./config');

// Configure App
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// FIXME: Temporary Database (User) Bootstrap
const { UserModel } = require('./database');
const admin = new UserModel({ username: "admin", role: "admin" });
admin.setPassword("123");
admin.save(function(err, admin) {
    if (err) {
        console.log("Could not save admin");
    }
})

// Authentication Endpoint
const { authRouter, isAuthenticated } = require('./auth/auth');
app.use('/auth', authRouter);

// FIXME: Temporary Protected Endpoint
app.get('/test', isAuthenticated, function(req, res) {
    res.send("Accessing a protected resource!");
})

app.listen(CONFIG.PORT_NUMBER, () => {
    console.log("Server listening on Port " + CONFIG.PORT_NUMBER);
})

module.exports = app;