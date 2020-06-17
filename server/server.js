const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const CONFIG = require('./config');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
const accessTokenSecret = '123456';
const refreshTokenSecret = 'asdfgh';


const { UserModel } = require('./database');
const { authenticate } = require('passport');

const admin = new UserModel({ username: "admin", role: "admin" });
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
    UserModel.findOne({ username: username }, function(err, user) {
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

        res.cookie('accessToken', accessToken);
        res.cookie('refreshToken', refreshToken);
        res.json({
            accessToken,
            refreshToken
        })
    })
});

app.post('/token', function(req, res) {
    // const { refreshToken } = req.body; 
    const refreshToken = req.cookies.refreshToken;

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
                                        { expiresIn: '10000'});
        
        res.cookie('accessToken', newAccessToken);
        // TODO: Must set refresh token too?
        return res.json({ newAccessToken });
    })
})

// TODO: This should be mounted on the /api/v1 route
function authenticateJWT(req, res, next) {
    // const authHeader = req.headers.authorization;

    // if (authHeader) {
    //     const token = authHeader.split(' ')[1];

    //     jwt.verify(token, accessTokenSecret, function(err, user) {
    //         if (err) {
    //             return res.sendStatus(403);
    //         }

    //         req.user = user;
    //         next();
    //     })
    // } else {
    //     return res.sendStatus(401);
    // }

    accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.sendStatus(401);
    }

    jwt.verify(accessToken, accessTokenSecret, function(err, user) {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    })    
}

function authenticateJWTAdmin(req, res, next) {
    let accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.sendStatus(401);
    }

    jwt.verify(accessToken, accessTokenSecret, function(err, user) {
        if (err) {
            return res.sendStatus(403);
        }

        // Additional Check
        if (user.role !== "admin") {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    })
}

app.post('/signup', authenticateJWTAdmin, function(req, res) {
    const { username, password, role } = req.body;
    const newUser = new UserModel({ username: username , role: role });
    newUser.setPassword(password);
    newUser.save(function(err, newUser) {
        if (err) {
            console.log("Could not save newUser");
            return res.sendStatus(501); //TODO: Change status code?
        }
        return res.send("Successfully created new user: " + username);
    });
});

app.post('/logout', function(req, res) {
    let refreshToken = req.cookies.refreshToken;
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.send("Logout successful");
})

app.get('/test', authenticateJWT, function(req, res) {
    res.send("Accessing a protected resource!");
})

app.listen(CONFIG.PORT_NUMBER, () => {
    console.log("Server listening on Port " + CONFIG.PORT_NUMBER);
})