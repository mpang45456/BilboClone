const express = require('express');
const router = express.Router();

const { UserModel } = require('../database');
const CONFIG = require('../config');
const { TokenManager } = require('./authUtils');

// Configure Router
const tm = new TokenManager();


// TODO: Remember to import authenticator from authUtils.js

/**
 * Access and Refresh JWTs are not sent through JSON. This 
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

router.post('/logout', function(req, res) {
    let refreshToken = req.cookies.refreshToken;
    tm.invalidateRefreshToken(refreshToken);
    res.status(200).send("Logout Successful");
})

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

// TODO: Must be used after `isAuthenticated` middleware
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