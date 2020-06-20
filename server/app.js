const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Configure App
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// FIXME: For testing purposes with `npm run react-start`
const cors = require('cors');
let corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true
}
app.use(cors(corsOptions));

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

// Set Up Static File Server
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
// app.get('*', function(req, res) {
//     res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
// })

module.exports = app;