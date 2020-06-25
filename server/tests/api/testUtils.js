const request = require('supertest');

export const protectedEndpoint = '/test';
export const loginEndpoint = '/api/v1/auth/login';
export const logoutEndpoint = '/api/v1/auth/logout';
export const tokenEndpoint = '/api/v1/auth/token';
export const userEndpoint = '/api/v1/user';

const { CookieAccessInfo } = require('cookiejar');



async function getAuthenticatedAgentAndTokens(server, username, password) {
    let agent = request.agent(server);
    await agent.post(loginEndpoint)
               .send({ username, password});
    
}