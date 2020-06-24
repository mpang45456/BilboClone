const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { UserModel } = require('../../../../data/database');
const { TokenManager } = require('./authUtils');
const { PermissionsTransformer, PERMS } = require('./permissions');

// Configure Router
const tm = new TokenManager();
const pt = new PermissionsTransformer();

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
            return res.status(500).send("Oops, something went wrong");
        }

        if (!user || !user.isValidPassword(password)) {
            return res.status(401).send("Invalid credentials");
        }

        // Generate Permission String
        let perms = pt.encode(user.permissions);

        // Generate Tokens
        const accessToken = tm.getNewAccessToken(user.username, perms);
        const refreshToken = tm.getNewRefreshToken(user.username, perms);

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

    const newAccessToken = tm.getNewAccessToken(user.username, user.permissions);
    res.cookie('accessToken', newAccessToken);
    res.sendStatus(200);
})

/**
 * Mounted: /auth/logout
 * Logs user out by invalidating refresh 
 * and access tokens.
 * 
 * Note: The refresh and access tokens are
 * invalidated differently:
 * - The refresh token is invalidated 
 * by removing it from the store of valid 
 * refresh tokens.
 * - The access token is invalidated by 
 * generating an access token past its
 * expiration and sending it back in the
 * response's cookies.
 */
router.post('/logout', function(req, res) {
    // Invalidate Refresh Token
    let refreshToken = req.cookies.refreshToken;
    tm.invalidateRefreshToken(refreshToken);

    // Generate a new (but invalid) Access Token
    let invalidAccessToken = tm.getInvalidAccessToken();
    res.cookie('accessToken', invalidAccessToken);
    res.status(200).send("Logout Successful");
})


// Middleware
/**
 * Ensures that user is logged in (valid
 * access token is used)
 * 
 * Note: This middleware also sets the user
 * object in `req.user`. The user object
 * contains the information encoded within
 * the access JWT (not the refresh JWT).
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

    logger.debug(user);
    req.user = user;
    next();
}

/**
 * Ensures that the user is authorized to
 * access a certain endpoint. Any number
 * of permissions can be entered, but take note
 * that typing the actual string representing
 * the permission should be avoided (to avoid
 * typos). Instead use the `PERMS` object's 
 * fields instead. 
 * 
 * 
 * Note: This middleware must only be used
 * AFTER `isAuthenticated` because it makes use
 * of `req.user`, which is set by `isAuthenticated`
 * @param  {...String} requiredPerms
 */
function isAuthorized(...requiredPerms) {
    return function(req, res, next) {
        let userPerms = pt.decode(req.user.permissions);
        if (!requiredPerms.every((requiredPerm) => userPerms.includes(requiredPerm))) {
            return res.sendStatus(403);
        } else {
            next();
        }
    }
}

module.exports = {
    authRouter: router,
    isAuthenticated,
    isAuthorized
};