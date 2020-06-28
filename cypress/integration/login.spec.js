const { users } = require('../../server/data/databaseBootstrap');

describe('Login Flow', () => {
    const loginPage = '/login';
    const homePage = '/';
    const usersPage = '/users';

    // Admin user with all authorization rights.
    // This e2e test is to check for login flow, 
    // (authorization checks are done in their 
    // respective e2e tests) so to keep the test simple,
    // the admin user is used in order to avoid url
    // redirects owing to lack of authorization
    const user = users[0]; 

    it('Access and Refresh JWTs set in cookies', () => {
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        cy.location('pathname').should('eq', '/');
        cy.getCookie('accessToken').should('exist');
        cy.getCookie('refreshToken').should('exist');
    })

    it(`Navigating to any page before authentication
        should redirect to /login and then redirect back
        to the same page after login`, () => {
        cy.visit(usersPage);
        // Redirect to login page
        cy.location('pathname').should('eq', loginPage);

        // Login
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        // Redirect back to original page
        cy.location('pathname').should('eq', usersPage);
    })

    it(`Navigating to /login after login should re-direct 
        to home page`, () => {
        cy.visit('/login');
        cy.get('input#username').type('admin'); //FIXME: Hardcoded
        cy.get('input#password').type('123{enter}');
        
        cy.visit('/login');
        cy.location('pathname').should('eq', '/');
    })

    it('Username field should have autofocus', () => {
        cy.visit(loginPage);
        cy.focused().should('have.id', 'username');
    })

    it(`Clicking on login button without typing credentials
        should cause help message to be displayed`, () => {
        cy.visit(loginPage);
        cy.get('.login-form-button').click();

        cy.contains('Please input your Username!') // Help text for username
        cy.contains('Please input your Password!') // Help text for password
    })

    it(`Logging in with invalid credentials should
        cause help message to be displayed`, () => {
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`wrongPassword{enter}`);
        cy.get('.login-form-button').click();

        cy.contains('Incorrect credentials. Please try again!')
    })

    it(`Clearing cookies after login should redirect
        user to the login page`, () => {
        // Initial login
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        cy.clearCookies();
        // FIXME: This is undone --> requires code changes

    })

    it(`Things to test`, () => {
        let stuff=`
        Things to test:

        Authentication should persist even after refreshing the page
        Authentication should not persist after clearing cookies and refreshing the page

        `
    })
})