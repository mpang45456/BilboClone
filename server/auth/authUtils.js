const jwt = require('jsonwebtoken');

const CONFIG = require('../config');

class RefreshTokenManager {
    constructor() {
        this.refreshTokens = [];
    }

    addRefreshToken(refreshToken) {
        this.refreshTokens.push(refreshToken);
    }

    removeRefreshToken(refreshToken) {
        this.refreshTokens = this.refreshTokens.filter(token => token !== refreshToken);
    }

    isValidRefreshToken(refreshToken) {
        
    }
}

function getNewAccessToken(username, role) {
    return jwt.sign({ username, role }, 
                    CONFIG.ACCESS_TOKEN_SECRET,
                    { expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY });
}

function getNewRefreshToken(username, role) {
    return jwt.sign({ username, role }, 
                    CONFIG.REFRESH_TOKEN_SECRET);
}

module.exports = {
    RefreshTokenManager, 
    getNewAccessToken, 
    getNewRefreshToken
}