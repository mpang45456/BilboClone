const { users } = require('../../server/data/databaseBootstrap');
import CONFIG from '../../client/src/config';

describe('Logout Flow', () => {
    // Admin user with all authorization rights.
    // This e2e test is to check for logout flow, 
    // (authorization checks are done in their 
    // respective e2e tests) so to keep the test simple,
    // the admin user is used in order to avoid url
    // redirects owing to lack of authorization
    const user = users[0]; 
    beforeEach(() => {
        cy.login(user.username, user.password);
    })

    it(`Upon clicking logout button, logout modal
        should appear`, () => {
        cy.visit(CONFIG.HOME_URL);
        
        // Click on logout button
        cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
        cy.get('.ant-modal-body');
    })

    it(`After logging out, user should be redirected 
        to login page`, () => {
        cy.visit(CONFIG.HOME_URL);
        
        // Click on logout button
        cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
        cy.contains('Confirm').click();
        cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
    })

    it(`After logging out, navigating to any protected URL
        will redirect to the login page`, () => {
        cy.visit(CONFIG.HOME_URL);
    
        // Click on logout button
        cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
        cy.contains('Confirm').click();

        // Navigate to users page
        cy.visit(CONFIG.USER_URL);

        // Should be redirected to login page
        cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
    })
})