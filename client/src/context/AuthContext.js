import { createContext, useContext } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

// App-wide Authentication Context
export const AuthContext = createContext();

// Hook to use the Context and gain access to variables set by Provider
// See `App.js` for values set in Provider.
export function useAuth() {
    return useContext(AuthContext);
}

// Helper function to get cookie by name (from `document.cookie`)
function getCookie(cookieName) {
    let name = cookieName + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Helper function to decode the JWT
function parseJWT(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

// FIXME: This mixes commonJS and AMD import syntax
// FIXME: The temporary fix for this was to add "sourceType": "unambiguous" to .babelrc
const perms = require('../../../server/routes/api/v1/auth/permissions');
export const PERMS = perms.PERMS;
const PermissionsTransformer = perms.PermissionsTransformer;
const pm = new PermissionsTransformer();
export function getPermissionsList() {
    let decodedAccessToken = parseJWT(getCookie('accessToken'));
    return pm.decode(decodedAccessToken.permissions);
}

/**
 * Helper object to make authenticated API calls.
 * 
 * As long as the browser still caches a valid refresh
 * token, any Bilbo API call will go through. This abstracts
 * away the need to constantly check for a valid access
 * token when making API calls.
 * 
 * This works through `axios.interceptor`, which
 * examines the response. If the response code is 401/403,
 * then `bax` will contact the /auth/token endpoint
 * to refresh the access token before re-attempting
 * to connect to the original API url. 
 * 
 * Naming of `bax`: _B_ilbo _ax_ios
 */
export const bax = axios.create();
bax.defaults.withCredentials = true; // FIXME: Required for react webpack-dev-server
bax.interceptors.response.use(
    function(res) {
        // Status Code: 2xx
        return res;
    }, function(err) {
        // Status Code: NOT 2xx
        const originalReq = err.config;

        // Only if 401(Unauthorized) or 403(Forbidden) will 
        // an attempt be made to refresh the access token
        if ((err.response.status === 401 || err.response.status === 403)) {
            if (originalReq.url === '/api/v1/auth/token') {
                // Prevent loops (i.e. /auth/token is the one that returns 401/403)
                // Happens when refresh token is invalid (e.g. due to logout)
                // Use Router to redirect to /login page
                withRouter(({history}) => {
                    history.push('/login');
                })
            } else {
                return bax.post('/api/v1/auth/token', { withCredentials: true})
                            .then(res => {
                                if (res.status === 200) {
                                    return bax(originalReq);
                                }
                            })
            }
        }
        
        return Promise.reject(err);
    }
)