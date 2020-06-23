const express = require('express');
const router = express.Router();

const logger = require('../utils');
const { UserModel } = require('../data/database');
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

/**
 * Mounted: /auth/user
 * 
 * Creates a NEW user. Request body must contain
 * username, password, permissions, name and position (JSON). 
 */
router.post('/user', 
            isAuthenticated, 
            isAuthorized(PERMS.USER_WRITE), 
            function(req, res) {
    const { username, password, permissions, name, position } = req.body;
    const newUser = new UserModel({ username, 
                                    permissions, 
                                    name, 
                                    position });
    newUser.setPassword(password);

    newUser.save(function(error, newUser) {
        if (error) {
            logger.error(`/auth/user: Could not save newUser: ${error}`);
            return res.status(400).send("Unable to create new user");
        }
        return res.status(200).send("Successfully created new user: " + username);
    });
})

/**
 * Mounted: /auth/user/:username
 * 
 * Patches the fields (password, permissions, name
 * position) of a user. The username cannot be changed.
 */
router.patch('/user/:username', 
             isAuthenticated, 
             isAuthorized(PERMS.USER_WRITE), 
             function(req, res) {
    const username = req.params.username;
    const { oldPassword, newPassword, permissions, name , position } = req.body;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) { return res.status(500).send("Oops, something went wrong"); }
        if (!user) { return res.status(400).send("User does not exist"); }

        if (newPassword) { 
            if (!user.isValidPassword(oldPassword)) {
                return res.status(400).send("Incorrect credentials");
            }
            user.setPassword(newPassword); 
        }
        if (permissions) { user.permissions = permissions; }
        if (name) { user.name = name; }
        if (position) { user.position = position; }

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
router.delete('/user/:username', 
              isAuthenticated, 
              isAuthorized(PERMS.USER_WRITE), 
              function(req, res) {
    const username = req.params.username;

    UserModel.deleteOne({ username: username }, function(err) {
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
 * 
 * // TODO: Can add query parameters to filter
 * the fields that are returned
 */
router.get('/user', 
           isAuthenticated, 
           isAuthorized(PERMS.USER_READ), 
           function(req, res) {
    let ret = [];

    UserModel.find({}, function(err, users) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        users.forEach(user => {
            ret.push({ username: user.username, 
                       permissions: user.permissions,
                       name: user.name,
                       position: user.position
            });
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
router.get('/user/:username', 
           isAuthenticated, 
           isAuthorized(PERMS.USER_READ), 
           function(req, res) {
    const username = req.params.username;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        if (!user) {
            return res.status(400).send("User does not exist");
        }

        res.status(200).json({ username: username, 
                               permissions: user.permissions,
                               name: user.name, 
                               position: user.position 
        });
    })
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