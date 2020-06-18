const express = require('express');
const router = express.Router();

const { UserModel } = require('../database');
const CONFIG = require('../config');
const authUtils = require('./authUtils');
const rtm = new authUtils.RefreshTokenManager();


// TODO: Remember to import authenticator from authUtils.js

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
        const accessToken = authUtils.getNewAccessToken(user.username, user.role);
        const refreshToken = authUtils.getNewRefreshToken(user.username, user.role);
        rtm.addRefreshToken(refreshToken);

        // Prepare Response
        res.cookie('accessToken', accessToken);
        res.cookie('refreshToken', refreshToken);
        res.sendStatus(200);
    })
});