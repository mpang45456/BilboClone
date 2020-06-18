// Config file for the server
CONFIG = {};
CONFIG.PORT_NUMBER = process.env.PORT || 3000;

// Database
CONFIG.DATABASE_URL = 'mongodb://localhost/testing';

// Authentication/Authorization
CONFIG.ACCESS_TOKEN_SECRET = 'accessTokenSecret';
CONFIG.ACCESS_TOKEN_EXPIRY = '10000';
CONFIG.REFRESH_TOKEN_SECRET = 'refreshTokenSecret';

module.exports = CONFIG;