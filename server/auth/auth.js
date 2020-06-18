const express = require('express');
const router = express.Router();

const { UserModel } = require('../database');
const CONFIG = require('../config');
const { TokenManager } = require('./authUtils');

// Configure Router
const tm = new TokenManager();

// Router Endpoints
/**
 * Mounted: /auth/login
 * For users to login. Username and password must be
 * sent through request body (JSON). Access and refresh
 * JWTs will be generated and attached to the response
 * as cookies.
 * 
 * Note: Access and Refresh JWTs are not sent through JSON. This 
 * is because if the app is opened in multiple tabs, then 
 * only 1 tab would have access to the JWT. But when sent
 * through cookies, all the tabs would have access (because
 * they have the same origin).
 */
router.post('/login', function(req, res) {
    const { username, password } = req.body;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return res.status(501).send("Oops, something went wrong");
        }

        if (!user || !user.isValidPassword(password)) {
            return res.status(401).send("Invalid credentials");
        }

        // Generate Tokens
        const accessToken = tm.getNewAccessToken(user.username, user.role);
        const refreshToken = tm.getNewRefreshToken(user.username, user.role);

        // Prepare Response
        res.cookie('accessToken', accessToken);
        res.cookie('refreshToken', refreshToken);
        res.sendStatus(200);
    })
});

/**
 * Mounted: /auth/token
 * Get a new access token. Refresh token must be valid in
 * order for access token to be updated successfully in
 * the response's cookies.
 */
router.post('/token', function(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.sendStatus(401); //Unauthorized
    }
    
    let { error, user } = tm.isValidRefreshToken(refreshToken);
    if (error) {
        return res.sendStatus(403); //Forbidden
    }

    const newAccessToken = tm.getNewAccessToken(user.username, user.role);
    res.cookie('accessToken', newAccessToken);
    res.sendStatus(200);
})

/**
 * Mounted: /auth/logout
 * Logs user out by invalidating refresh token.
 * 
 * Note: The access token held by the user is 
 * still valid if not expired. This means that 
 * while the user will no longer be able to obtain
 * a new access token at the /token endpoint, the
 * access token can still be used to access protected
 * resources until expiration. Hence, the client 
 * must implement an appropriate mechanism to prevent
 * the use of the access token after contacting /logout.
 */
router.post('/logout', function(req, res) {
    let refreshToken = req.cookies.refreshToken;
    tm.invalidateRefreshToken(refreshToken);
    res.status(200).send("Logout Successful");
})

/**
 * Mounted: /auth/user
 * 
 * Creates a new user. Request body must contain
 * username, password and role (JSON). 
 * 
 * Note: Only an admin user can access this endpoint
 */
router.post('/user', isAuthenticated, isAdmin, function(req, res) {
    const { username, password, role } = req.body;
    const newUser = new UserModel({ username: username , role: role });
    newUser.setPassword(password);

    newUser.save(function(error, newUser) {
        if (error) {
            console.log("Could not save newUser"); // FIXME: Use pino?
            return res.status(500).send("New User Not Saved");
        }
        return res.status(200).send("Successfully created new user: " + username);
    });
})


// Authentication Middleware
/**
 * Ensures that user is logged in (valid
 * access token is used)
 */
function isAuthenticated(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.sendStatus(401); //Unauthorized
    }

    let { error, user } = tm.isValidAccessToken(accessToken);
    
    if (error) {
        return res.sendStatus(403); //Forbidden
    }

    req.user = user;
    next();
}

/**
 * Ensures that user has "admin" role.
 * Must be used AFTER the `isAuthenticated` middleware.
 */
function isAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.sendStatus(403);
    }

    next();
}

module.exports = {
    authRouter: router,
    isAuthenticated,
    isAdmin
};