const express = require('express');

const CONFIG = require('./config');

const app = express();
app.use(express.static(__dirname + '/../client/dist'));

app.listen(CONFIG.PORT_NUMBER, function() {
    console.log("Server listening on port " + CONFIG.PORT_NUMBER);
})