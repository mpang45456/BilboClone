// Config file for the server
let CONFIG = {};
CONFIG.PORT_NUMBER = process.env.PORT || 3000;
CONFIG.NODE_ENV = process.env.NODE_ENV || "dev";

// Database
CONFIG.DATABASE_URL = `mongodb://localhost/${CONFIG.NODE_ENV}`;

// Authentication/Authorization
CONFIG.ACCESS_TOKEN_SECRET = 'accessTokenSecret';
CONFIG.ACCESS_TOKEN_EXPIRY = '600000'; //10 minutes
CONFIG.REFRESH_TOKEN_SECRET = 'refreshTokenSecret';

// Pagination
CONFIG.DEFAULT_PAGE_LIMIT = 50;

module.exports = CONFIG;