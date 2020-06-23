const express = require('express');
const router = express.Router();

const logger = require('../utils');
const { UserModel } = require('../data/database');
const { TokenManager } = require('./authUtils');
const { PermissionsManager } = require('./permissions');

// Configure Router
const tm = new TokenManager();
const pm = new PermissionsManager();

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
        let perms = pm.encode(user.permissions);

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

/**
 * Mounted: /auth/user
 * 
 * Creates a new user. Request body must contain
 * username, password and role (JSON). 
 * 
 * Note: Only an admin user can access this endpoint
 */
router.post('/user', isAuthenticated, isAdmin, function(req, res) {
    // TODO: Update
    const { username, password, role } = req.body;
    const newUser = new UserModel({ username: username , role: role });
    newUser.setPassword(password);

    newUser.save(function(error, newUser) {
        if (error) {
            logger.error("/auth/user: Could not save newUser");
            return res.status(400).send("Unable to create new user");
        }
        return res.status(200).send("Successfully created new user: " + username);
    });
})

/**
 * Mounted: /auth/user/:username
 * 
 * Patches the fields (password and role) of a user.
 * 
 * Note: The current implementation only allows 
 * the admin to update a user's credentials and role
 */
router.patch('/user/:username', isAuthenticated, isAdmin, function(req, res) {
    const username = req.params.username;
    const { password, role } = req.body;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) { return res.status(500).send("Oops, something went wrong"); }
        if (!user) { return res.status(400).send("User does not exist"); }

        if (password) { user.setPassword(password); }
        if (role) { user.role = role; }

        user.save()
            .then(() => res.status(200).send("Updated User Details"))
            .catch((error) => logger.error(`/user/:username: ${error}`));
    })
})

/**
 * Mounted: /auth/user/:username
 * 
 * Deletes the user `:username`. If `:username`
 * does not exist in the database, a success status
 * is still sent (because the outcome of a DELETE 
 * request is to make sure the resource does not exist
 * at the end of a request)
 */
router.delete('/user/:username', isAuthenticated, isAdmin, function(req, res) {
    const username = req.params.username;

    UserModel.deleteOne({ username: username}, function(err) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        res.status(200).send("Deleted User");
    })
})

/**
 * Mounted: /auth/user
 * 
 * Gets the collection of users (returns as JSON)
 * 
 * Note: JSON Format: 
 * [
 *      {
 *          "username": username
 *          "role": role
 *      }
 *      ...
 * ]
 */
router.get('/user', isAuthenticated, isAdmin, function(req, res) {
    let ret = [];

    UserModel.find({}, function(err, users) {
        users.forEach(user => {
            ret.push({ username: user.username, role: user.role });
        })
        res.status(200).json(ret);
    })
})

/**
 * Mounted: /auth/user
 * 
 * Gets the user (`:username`) (returns as JSON)
 * 
 * Note: JSON Format: 
 * {
 *      "username": username,
 *      "role": role
 * }
 */
router.get('/user/:username', isAuthenticated, isAdmin, function(req, res) {
    const username = req.params.username;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        if (!user) {
            return res.status(400).send("User does not exist");
        }

        res.status(200).json({ username: username, role: user.role });
    })
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

    logger.debug(user);
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

// Must be used AFTER 'isAuthenticated' because
// it makes use of `req.user`, which is set by `isAuthenticated`
function isAuthorized(...requiredPerms) {
    return function(req, res, next) {
        let userPerms = pm.decode(req.user.permissions);
        if (!requiredPerms.every((requiredPerm) => userPerms.includes(requiredPerm))) {
            return res.sendStatus(401);
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