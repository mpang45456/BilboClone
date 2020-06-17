// Config file for the server
CONFIG = {};
CONFIG.PORT_NUMBER = process.env.PORT || 3000;

// Database
CONFIG.DATABASE_URL = 'mongodb://localhost/testing';
module.exports = CONFIG;