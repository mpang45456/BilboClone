const jwt = require('jsonwebtoken');
const CONFIG = require('../config');

/**
 * Class to manage the generation and checking
 * of access and refresh tokens. JWTs are used.
 * 
 * Current implementation simply stores all 
 * refresh tokens in memory. Logic is encapsulated
 * within this class so that a future swap to a
 * different data store can be easily done.
 */
class TokenManager {
    constructor() {
        this.validRefreshTokens = [];
    }

    /**
     * Get a new access token. Only the username
     * and role in the `User` schema is embedded
     * inside the JWT.
     * @param {String} username 
     * @param {String} role 
     */
    getNewAccessToken(username, role, permissions) {
        return jwt.sign({ username, role, permissions }, 
                        CONFIG.ACCESS_TOKEN_SECRET,
                        { expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY });
    }

    /**
     * Check if the access token is valid.
     * @param {String} accessToken 
     */
    isValidAccessToken(accessToken) {
        try {
            let user = jwt.verify(accessToken, CONFIG.ACCESS_TOKEN_SECRET);
            return { error: null, user: user};
        } catch (error) {
            return { error: error, user: null};
        }
    }

    /**
     * Returns an invalid access token (past its
     * expiration)
     */
    getInvalidAccessToken() {
        return jwt.sign({ username: "invalid", role: "invalid", permissions: "invalid" }, 
                        CONFIG.ACCESS_TOKEN_SECRET,
                        { expiresIn: -CONFIG.ACCESS_TOKEN_EXPIRY });
    }
    
    /**
     * Get a new refresh token. Only the username 
     * and role in the `User` schema is embedded
     * inside the JWT.
     * 
     * Also stores the new refresh token in 
     * `this.validRefreshTokens` for possible
     * future invalidation.
     * @param {String} username
     * @param {String} role
     */
    getNewRefreshToken(username, role, permissions) {
        const refreshToken = jwt.sign({ username, role, permissions }, 
                                      CONFIG.REFRESH_TOKEN_SECRET);
        this.validRefreshTokens.push(refreshToken); // TODO: Document this
        return refreshToken;
    }

    /**
     * Removes `refreshToken` from `this.validRefreshTokens`
     * Only refresh tokens in `this.validRefreshTokens`
     * are able to generate new access tokens.
     * @param {String} refreshToken 
     */
    invalidateRefreshToken(refreshToken) {
        this.validRefreshTokens = this.validRefreshTokens.filter(token => token !== refreshToken);
    }

    /**
     * Check if the refresh token is valid. 
     * Does 2 checks:
     * 1. Refresh token is in `this.validRefreshTokens`
     * 2. Refresh token passes `jwt.verify` (secret key is correct)
     * @param {String} refreshToken 
     */
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