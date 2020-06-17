const express = require('express');

const CONFIG = require('./config');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/testing', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error: '));
db.once('open', function() {
    const UserSchema = new mongoose.Schema({
        name: String, 
        password: String
    })
})




const app = express();
app.use(express.static(__dirname + '/../client/dist'));

app.listen(CONFIG.PORT_NUMBER, function() {
    console.log("Server listening on port " + CONFIG.PORT_NUMBER);
})