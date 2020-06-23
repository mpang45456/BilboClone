const { checkPropTypes } = require("prop-types");

describe('Login Flow', () => {
    const loginEndpoint = '/login';

    it('Access and Refresh JWTs set in cookies', () => {
        cy.visit('/login');
        cy.get('input#username').type('admin'); //FIXME: Hardcoded
        cy.get('input#password').type('123{enter}');

        cy.location('pathname').should('eq', '/');
        cy.getCookie('accessToken').should('exist');
        cy.getCookie('refreshToken').should('exist');
    })

    it('Navigating to /login after login should re-direct to home page', () => {
        cy.visit('/login');
        cy.get('input#username').type('admin'); //FIXME: Hardcoded
        cy.get('input#password').type('123{enter}');
        
        cy.visit('/login');
        cy.location('pathname').should('eq', '/');
    })

    it('Username field should have autofocus', () => {
        cy.visit(loginEndpoint);
        cy.focused().should('have.id', 'username');
    })
})