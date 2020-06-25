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
const { PermissionsTransformer } = require('../../../server/routes/api/v1/auth/permissions');
const pm = new PermissionsTransformer();
export function getPermissionsList() {
    let decodedAccessToken = parseJWT(getCookie('accessToken'));
    return pm.decode(decodedAccessToken.permissions);
}