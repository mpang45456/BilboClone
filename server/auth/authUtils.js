const jwt = require('jsonwebtoken');

const CONFIG = require('../config');

class TokenManager {
    constructor() {
        this.validRefreshTokens = [];
    }

    getNewAccessToken(username, role) {
        return jwt.sign({ username, role }, 
                        CONFIG.ACCESS_TOKEN_SECRET,
                        { expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY });
    }

    isValidAccessToken(accessToken) {
        try {
            let user = jwt.verify(accessToken, CONFIG.ACCESS_TOKEN_SECRET);
            return { error: null, user: user};
        } catch (error) {
            return { error: error, user: null};
        }
    }
    
    getNewRefreshToken(username, role) {
        const refreshToken = jwt.sign({ username, role }, 
                                      CONFIG.REFRESH_TOKEN_SECRET);
        this.validRefreshTokens.push(refreshToken); // TODO: Document this
        return refreshToken;
    }

    invalidateRefreshToken(refreshToken) {
        this.validRefreshTokens = this.validRefreshTokens.filter(token => token !== refreshToken);
    }

    isValidRefreshToken(refreshToken) {
        // Check if refresh token is in valid list
        if (!this.validRefreshTokens.includes(refreshToken)) {
            return { error: "Refresh Token Invalid", user: null };
        }

        try {
            let user = jwt.verify(refreshToken, CONFIG.REFRESH_TOKEN_SECRET);
            return { error: null, user: user};
        } catch (error) {
            return { error: error, user: null};
        }
    }
}

module.exports = {
    TokenManager
}