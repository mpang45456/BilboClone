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
    username: String, 
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

app.post('/login', passport.authenticate('local', { successRedirect: "/", failureRedirect: "/login.html"}), function(req, res) {
    console.log('received');
})

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login.html');
    }
}

app.get('/protected', ensureAuthenticated, function(req, res) {
    console.log("protected");
})

app.listen(CONFIG.PORT_NUMBER, function() {
    console.log("Server listening on port " + CONFIG.PORT_NUMBER);
})