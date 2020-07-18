const request = require('supertest');
const { CookieAccessInfo } = require('cookiejar');
const cookie = require('cookie');

export const protectedEndpoint = '/api/v1/user';
export const loginEndpoint = '/api/v1/auth/login';
export const logoutEndpoint = '/api/v1/auth/logout';
export const tokenEndpoint = '/api/v1/auth/token';
export const userEndpoint = '/api/v1/user';
export const supplierEndpoint = '/api/v1/supplier';
export const partEndpoint = '/api/v1/part';
export const customerEndpoint = '/api/v1/customer';
export const salesOrderEndpoint = '/api/v1/salesOrder';
export const purchaseOrderEndpoint = '/api/v1/purchaseOrder';
export const warehouseEndpoint = '/api/v1/warehouse';

/**
 * Returns a supertest agent that has already sent a POST
 * request to the login endpoint with the provided credentials.
 * The agent remains authenticated because it preserves the cookies
 * (i.e. the access and refresh JWTs).
 *  
 * The correct credentials (username and password) must be 
 * provided, otherwise the agent remains unauthenticated.
 * 
 * @param {Object} server (returned by app.listen())
 * @param {String} username 
 * @param {String} password 
 */
export async function getAuthenticatedAgent(server, username, password) {
    let agent = request.agent(server);
    await agent.post(loginEndpoint)
               .send({ username, password});
    return agent;
}

/**
 * Returns the value of the cookie stored in the supertest
 * agent's cookie jar.
 * @param {supertest.agent} agent 
 * @param {String} cookieName 
 */
export function getCookieValueFromAgent(agent, cookieName) {
    const accessInfo = CookieAccessInfo();
    return agent.jar.getCookie(cookieName, accessInfo).value;
}

/**
 * Returns JSON object after parsing cookies in 
 * `res`'s header
 * 
 * The alternative method of retrieving the cookies
 * is to obtain them via the `getCookie` method
 * in `supertest.agent.jar`.
 * @param {Object} res 
 */
export function parseCookiesFromResponse(res) {
    return cookie.parse(res.header['set-cookie'].join('; '));
}