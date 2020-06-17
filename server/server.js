const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const CONFIG = require('./config');

app.use(bodyParser.json());
const accessTokenSecret = '123456';
const refreshTokenSecret = 'asdfgh';

/**
 * MongoDB
 */
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/testing', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error: '));
db.once('open', function() {
    console.log("DB connection is ready!"); //FIXME: DEBUG
})

const crypto = require('crypto');
const { access } = require('fs');
const { Schema } = mongoose;

const UsersSchema = new Schema({
    username: {type: String, unique: true}, 
    hash: String,
    salt: String,
    role: String,
})

// TODO: Note: This isn't used yet
UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.isValidPassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

const UsersModel = mongoose.model('Users', UsersSchema);

const admin = new UsersModel({ username: "admin", role: "admin" });
admin.setPassword("123");
admin.save(function(err, admin) {
    if (err) {
        console.log("Could not save admin");
    }
})



let refreshTokens = [];

app.post('/login', function(req, res) {
    const { username, password } = req.body;

    // FIXME: Be careful of messages being sent.
    // TODO: Send with status code
    // TODO: Deal with issue of multiple usernames? Or because username is unique then...?
    UsersModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return res.send("Oops, something went wrong!");
        }

        if (!user) {
            return res.send("Invalid username");
        }

        if (!user.isValidPassword(password)) {
            return res.send("Invalid password");
        }

        const accessToken = jwt.sign({ username: user.username, role: user.role }, 
                                     accessTokenSecret,
                                     { expiresIn: '10000' }); //FIXME: DEBUG
        const refreshToken = jwt.sign({ username: user.username, role: user.role }, 
                                      refreshTokenSecret);

        // TODO: Encapsulate this into a class. So that the data store can be hot swapped
        refreshTokens.push(refreshToken);

        res.json({
            accessToken,
            refreshToken
        })
    })
    
});

app.post('/token', function(req, res) {
    const { refreshToken } = req.body; 

    if (!refreshToken) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(refreshToken)) {
        return res.sendStatus(403);
    }

    jwt.verify(refreshToken, refreshTokenSecret, function(err, user) {
        if (err) {
            return res.sendStatus(403);
        }

        const newAccessToken = jwt.sign({ username: user.username, role: user.role },
                                        accessTokenSecret,
                                        { expiresIn: '20m'});
        
        return res.json({ newAccessToken });
    })
})

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, accessTokenSecret, function(err, user) {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        })
    } else {
        return res.sendStatus(401);
    }
}

app.get('/test', authenticateJWT, function(req, res) {
    res.send("Accessing a protected resource!");
})

app.listen(CONFIG.PORT_NUMBER, () => {
    console.log("Server listening on Port " + CONFIG.PORT_NUMBER);
})