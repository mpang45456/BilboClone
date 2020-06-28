const { users } = require('../../server/data/databaseBootstrap');

describe('Login Flow', () => {
    const loginPage = '/login';
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
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);
        
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
        user to the login page after attempted interaction
        with the app`, () => {
        // Initial login
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        cy.clearCookies();
        // Click on 'Users' Sidebar Menu Item (simulate app interaction)
        cy.contains('Users').click();
        // Should be redirected to login page
        cy.location('pathname').should('eq', loginPage);
    })

    it(`Should be redirected to login after clearing cookies
        and refreshing the page`, () => {
        // Initial login
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        // Navigate to any page
        cy.visit(usersPage);

        cy.clearCookies();
        cy.reload();
        // Should be redirected to login page after reload
        cy.location('pathname').should('eq', loginPage);
    })

    it(`Authentication should persist even after browser
        refresh and should stay at the same page`, () => {
        // Initial login
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        // Navigate to any page
        cy.visit(usersPage)
          .wait(1000)
          .reload();
        
        cy.location('pathname').should('not.eq', loginPage);
    })

    it(`Invalidating access JWT cookie should still
        allow authentication to persist (i.e. no need to
        re-login)`, () => {
        // Initial login
        cy.visit(loginPage);
        cy.get('input#username').type(user.username);
        cy.get('input#password').type(`${user.password}{enter}`);

        cy.clearCookie('accessToken');
        
        // Click on 'Users' Sidebar Menu Item (simulate app interaction)
        cy.contains('Users').click();
        cy.location('pathname').should('eq', usersPage);

        cy.reload();
        cy.location('pathname').should('eq', usersPage);
    })
})