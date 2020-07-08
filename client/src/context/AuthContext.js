import { createContext, useContext } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import CONFIG from '../config';

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
 * examines the response. If the response code is 401,
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

        // For refreshing the access token
        // Only if 401(Unauthorized) will an attempt
        // be made to refresh the access token
        if (err.response.status === 401) {
            if (originalReq.url === '/api/v1/auth/token') {
                // Prevent loops (i.e. /auth/token is the one that returns 401)
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
        
        // For 2 cases:
        // 1. All other error codes (e.g. status code 500)
        // 2. If /auth/token returns 401 (i.e. refresh rejected)
        return Promise.reject(err);
    }
)

/**
 * Default error handler when making bax API calls. 
 * This is meant to be used in the `catch` chained
 * method. 
 * 
 * To customise error handling behaviour based on the
 * status code, simply add custom code dealing with 
 * the particular status code before calling this 
 * function. 
 * 
 * For example:
 * ```
 * .catch(err => {
 *    if (err.response.status === 400) {
 *        // Custom Behaviour Here
 *    } else {
 *        redirectToErrorPage(err, history);
 *    }
 * })
 * ```
 */
export function redirectToErrorPage(err, history) {
    if (!history) { throw new Error('A `history` object must be provided to `redirectToErrorPage`'); }
    try {
        console.error(err);
        let statusCode = err.response.status;
        switch(statusCode) {
            // Bad Request
            case 400:
                history.push(CONFIG.ERROR_400_URL);
                break;
            // When unauthenticated
            case 401:
                history.push(CONFIG.LOGIN_URL);
                break;
            // Forbidden (Unauthorized)
            case 403:
                history.push(CONFIG.ERROR_403_URL);
                break;
            // Not Found
            case 404:
                history.push(CONFIG.ERROR_404_URL);
                break;
            default:
                history.push(CONFIG.ERROR_500_URL);
        }
    } catch(tryBlockErr) {
        console.error(tryBlockErr);
    }
}