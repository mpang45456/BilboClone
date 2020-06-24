const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressPino = require('express-pino-logger');

// Configure App
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const logger = require('./utils');
const expressLogger = expressPino({ logger });
app.use(expressLogger);

// FIXME: For testing purposes with `npm run react-start`
const cors = require('cors');
let corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true
}
app.use(cors(corsOptions));

// Database Bootstrap
if (process.env.RESET_DB === 'true') {
    const { resetAndSeedDatabase } = require('./data/database');
    resetAndSeedDatabase();
}

// Authentication Endpoint
const { apiV1Router } = require('./routes/api/v1/router');
app.use('/api/v1', apiV1Router);

// FIXME: Temporary Protected Endpoint
const { isAuthenticated, isAuthorized } = require('./routes/api/v1/auth/auth');
app.get('/test', isAuthenticated, function(req, res) {
    res.send("Accessing a protected resource!");
})

// FIXME: Temporary Protected Endpoint (to test authorization middleware)
const { PERMS } = require('./routes/api/v1/auth/permissions');
app.get('/test2', isAuthenticated, isAuthorized(PERMS.PURCHASES_READ, PERMS.PURCHASES_WRITE), function(req, res) {
    res.send("Accessing Purchases-Only protected resource!");
});

// Set Up Static File Server
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

// Enable HTML5 pushstate
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '..', '/client/dist/index.html'));
})

module.exports = app;