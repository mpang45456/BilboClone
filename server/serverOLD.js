const express = require('express');
const app = express(); // FIXME: Shift this later
const CONFIG = require('./config');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/testing', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error: '));
db.once('open', function() {
    console.log("DB connection is ready!"); //FIXME: DEBUG
})

/**
 * MongoDB
 */
const crypto = require('crypto');
const { Schema } = mongoose;

const UsersSchema = new Schema({
    username: {type: String, unique: true}, 
    hash: String, 
    salt: String
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

const admin = new UsersModel({ username: "admin" });
admin.setPassword("123");
admin.save(function(err, admin) {
    if (err) {
        console.log("Could not save admin");
    }

    console.log(admin);
})



/**
 * Passport
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
    UsersModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false, { message: "Incorrect username."});
        }

        if (!user.isValidPassword(password)) {
            return done(null, false, { message: "Incorrect password."});
        }

        return done(null, user);
    })
}));

/**
 * Express
 */
const session = require('express-session');
const bodyParser = require('body-parser');
// app.use(session({ secret: "SECRETPLSCHANGE ",
//                   saveUninitialized: false, 
//                   resave: false })); //FIXME: Change
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user.id);
})

passport.deserializeUser(function(id, done) {
    UsersModel.findById(id, function(err, user) {
        done(err, user);
    })
})

/**
 * Server
 */
app.use(express.static(__dirname + '/../client/dist'));

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    let redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    console.log('received');
    res.redirect(redirectTo);
})

app.post('/signup', ensureAuthenticated, function(req, res) {
    console.log("HERE");
    console.log(req.body);

    // TODO: Add validation (check for existence)
    // TODO: Add logging for requests and responses
    const newUser = new UsersModel({ username: req.body.username });
    newUser.setPassword(req.body.password);
    newUser.save(function(err, newUser) {
        if (err) {
            console.log("Could not save newUser: " + err);
        }
    })

    res.send("signed up!");
})

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        console.log("req.url: " + req.url);
        req.session.returnTo = req.url;
        res.redirect('/login.html');
    }
}

const path = require('path');
app.get('/login', function(req, res) {
    res.sendFile(path.resolve(__dirname + "/../client/dist/login.html"));
})

app.get('/protected', ensureAuthenticated, function(req, res) {
    res.send("Able to access protected resource");
})

app.get('/signup', function(req, res) {
    res.sendFile(path.resolve(__dirname + "/../client/dist/signup.html"));
})


app.listen(CONFIG.PORT_NUMBER, function() {
    console.log("Server listening on port " + CONFIG.PORT_NUMBER);
})