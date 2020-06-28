const { users } = require('../../server/data/databaseBootstrap');
import CONFIG from '../../client/src/config';
const { PERMS } = require('../../server/routes/api/v1/auth/permissions');

describe('User Flow', () => {
    const userReadWrite = users[0];
    const userRead = users[2];
    const userNoPerms = users[1];
    const addUserURL = CONFIG.USER_URL + 'add';
    const newUser = {
        username: 'newUser',
        password: 'newPassword',
        position: 'Test User',
        reportsTo: 'admin',
        name: 'New User',
        permissions: [PERMS.USER_READ]
    }
    
    const loginAsUserReadWrite = () => {
        cy.login(userReadWrite.username, userReadWrite.password);
    }

    const loginAsUserRead = () => {
        cy.login(userRead.username, userRead.password);
    }

    const loginAsUserNoPerms = () => {
        cy.login(userNoPerms.username, userNoPerms.password);
    }

    beforeEach(() => {
        // Reset and Seed Users Collection in Database
        cy.exec('RESET_DB_USERS=true npm run cypress:reset_db');
    })

    it(`User without any of the USER permissions should not 
        be able to access any of the user-related URLS and 
        should be redirected to Error 403 Page`, () => {
        loginAsUserNoPerms();
        // All Users Page
        cy.visit(CONFIG.USER_URL);
        cy.location('pathname').should('not.eq', CONFIG.USER_URL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Add User Page
        cy.visit(addUserURL)
        cy.location('pathname').should('not.eq', addUserURL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Edit User Page
        cy.visit(`${CONFIG.USER_URL}/${users[0].username}/edit`)
        cy.location('pathname').should('not.eq', `${CONFIG.USER_URL}/${users[0].username}/edit`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);
    })

    it(`User with USER_READ permission should be able
        to access Users menu, and perform read actions
        only`, () => {
        loginAsUserRead();
        cy.visit(CONFIG.USER_URL);

        // Should be on /users page
        cy.location('pathname').should('eq', CONFIG.USER_URL);
        cy.location('pathname').should('not.eq', CONFIG.ERROR_403_URL);

        // Should be able to see all users
        cy.get('.ant-list-items')
          .children()
          .its('length')
          .should('eq', users.length);

        // `view` button should be clickable
        cy.get('.ant-list-item-action')
          .contains('view')
          .should('not.be', 'disabled')
          .and('exist')
        
        // Show More Button with 'Add a User' button should be disabled
        cy.get('.ant-btn')
          .should('be', 'disabled')
    })

    it(`User with USER_READ permission should not be able
        to navigate to URLs associated with write actions`, () => {
        loginAsUserRead();
        // Add User Page
        cy.visit(addUserURL)
        cy.location('pathname').should('not.eq', addUserURL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Edit User Page
        cy.visit(`${CONFIG.USER_URL}/${users[0].username}/edit`)
        cy.location('pathname').should('not.eq', `${CONFIG.USER_URL}/${users[0].username}/edit`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);
    })

    it(`User with USER_WRITE permission should be able
        to access Users menu, and perform both read and 
        write actions`, () => {
        loginAsUserReadWrite();
        cy.visit(CONFIG.USER_URL);

        // Should be on /users page
        cy.location('pathname').should('eq', CONFIG.USER_URL);
        cy.location('pathname').should('not.eq', CONFIG.ERROR_403_URL);

        // Should be able to see all users
        cy.get('.ant-list-items')
          .children()
          .its('length')
          .should('eq', users.length);

        // `view` button should be clickable
        cy.get('.ant-list-item-action')
          .contains('view')
          .should('not.be', 'disabled')
          .and('exist')

        // `edit` button should be clickable
        cy.get('.ant-list-item-action')
          .contains('edit')
          .should('not.be', 'disabled')
          .and('exist')
        
        // Show More Button with 'Add a User' button should be disabled
        cy.get('.ant-btn').click()
        cy.get('.ant-dropdown-menu-item'); // `Add a User` button
    })

    it(`User with USER_READ permission should be able
        to view user details but not be able to access
        write actions`, () => {
        loginAsUserRead();
        cy.visit(CONFIG.USER_URL);
        // Click on 2nd View Item (because 1st View Item
        // has no reportsTo link in user detail page)
        cy.get(':nth-child(2) > .ant-list-item-action > :nth-child(1)')
          .click()
        
        // URL should be valid (`/users/:username`)
        cy.location('pathname').should('match', /\/users\/.+/);

        // ShowMoreButton should be disabled
        cy.get('.ant-btn')
          .should('be', 'disabled')

        // `Reports To` field should have a clickable link
        cy.contains('Username')
          .siblings()
          .then($usernameTd => {
            const currUsername = $usernameTd.text();

            // Upon clicking the link, the user's details should change
            // to that of the username associated with the `reportsTo` field
            // Here, the test is checking if the username has changed (since it
            // is guaranteed to be unique among users)
            cy.contains('Reports To')
              .siblings()
              .find('a')
              .click()
              .then(() => {
                  cy.contains('Username')
                    .siblings()
                    .then(($reportsToUsernameTd) => {
                        expect($reportsToUsernameTd.text()).not.to.equal(currUsername);
                    })
              })
        })
    })

    it(`User with USER_WRITE permissions should be able to 
        access write actions, edit user details and have the 
        changes persisted`, () => {
        const newNameForUser = 'newNameForUser';
        const newPasswordForUser = 'newPasswordForUser';

        loginAsUserReadWrite();
        cy.visit(CONFIG.USER_URL);

        // Click on 2nd `view` Item
        cy.get(':nth-child(2) > .ant-list-item-action > :nth-child(1)')
          .click()

        // Click on ShowMoreButton in UserEditPage
        cy.get('.ant-btn')
          .click()

        // Click on `Edit User Details` button in dropdown
        cy.get('.ant-dropdown-menu-item')
          .click()

        cy.location('pathname').should('match', /\/users\/.+\/edit/);
        
        // Username field should not be editable
        cy.contains('Username')
          .siblings()
          .find('input')
          .should('be', 'disabled')
          .invoke('val')
          .then(username => {
              // Change the Name field
              cy.contains('Name')
                .siblings()
                .find('input')
                .clear()
                .type(`${newNameForUser}`)
              
              // Change the Password field
              cy.contains('Reset Password')
                .siblings()
                .find('input')
                .clear()
                .type(`${newPasswordForUser}`)
      
              // Click on Update button
              cy.get('.ant-btn-primary')
                .click()
      
              // Redirect back to All Users Page
              cy.location('pathname').should('eq', CONFIG.USER_URL);
      
              // New Name should be found in All Users Page
              cy.contains(newNameForUser);

              // Logout
              cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
              cy.contains('Confirm').click();

              // Login with new password
              cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
              cy.get('input#username').type(username);
              cy.get('input#password').type(`${newPasswordForUser}{enter}`);
              cy.location('pathname').should('eq', CONFIG.HOME_URL);
          })
    })

    it(`User with USER_WRITE permission should be able
        to access edit user details page from All Users Page 
        via 'edit' link, and be able to delete the user`, () => {
        loginAsUserReadWrite();
        cy.visit(CONFIG.USER_URL);
        
        // Click on `edit` link
        cy.get('.ant-list-item-action')
          .contains('edit')
          .click();

        // URL should change to edit user details page
        cy.location('pathname').should('match', /\/users\/.+\/edit/);

        // Obtain username (For test)
        cy.contains('Username')
          .siblings()
          .find('input')
          .invoke('val')
          .then(username => {
              // Click on ShowMoreButton
              cy.get('.ant-btn > .anticon > svg')
                .click()

              // Click on Delete User Button
              cy.get('.ant-dropdown-menu-item')
                .click()

              // Modal should appear asking for confirmation
              cy.contains('Confirm').click();

              // Should be redirected back to All Users Page
              cy.location('pathname').should('eq', CONFIG.USER_URL);

              // Should have 1 less user in All Users Page
              cy.get('.ant-list-items')
                  .children()
                  .its('length')
                  .should('eq', users.length - 1);

              // Logout
              cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
              cy.contains('Confirm').click();

              // Should not be able to login with user's credentials
              let password = users.filter(user => {
                return user.username === username;
              })[0].password;
              cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
              cy.get('input#username').type(username);
              cy.get('input#password').type(`${password}{enter}`);
              cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
              cy.contains('Incorrect credentials. Please try again!');
          })
    })

    it.only(`User with USER_WRITE permission should be able to
        create a new user`, () => {
        loginAsUserReadWrite();
        cy.visit(CONFIG.USER_URL);

        // Click on AllUsersShowMoreButton
        cy.get('.ant-btn > .anticon > svg').click()
        
        // Click on "Add User" in dropdown
        cy.get('.ant-dropdown-menu-item').click()

        cy.location('pathname').should('eq', addUserURL);

        // Fill in fields
        ['name', 'position', 'reportsTo', 'username', 'password'].map(field => {
            cy.get(`#createNewUserForm_${field}`).click()
            cy.get(`#createNewUserForm_${field}`).type(`${newUser[field]}{enter}`);
        })

        // Fill in permissions field
        for (let perm of newUser.permissions) {
            cy.get('#createNewUserForm_permissions').click()
            cy.get('#createNewUserForm_permissions').type(`${perm}{enter}`);
        }

        // Submit form and create new user
        cy.contains('Submit').click();

        // Should redirect back to All Users Page
        cy.location('pathname').should('eq', CONFIG.USER_URL);

        // Logout
        cy.get('.ant-row > :nth-child(1) > .anticon > svg > path').click();
        cy.contains('Confirm').click();

        // Should be able to login with newly-created user's credentials
        cy.location('pathname').should('eq', CONFIG.LOGIN_URL);
        cy.get('input#username').type(newUser.username);
        cy.get('input#password').type(`${newUser.password}{enter}`);
        cy.location('pathname').should('eq', CONFIG.HOME_URL);

        // Should be able to access protected endpoints (based on permissions)
        cy.visit(CONFIG.USER_URL);
        cy.location('pathname').should('eq', CONFIG.USER_URL);
        cy.location('pathname').should('not.eq', CONFIG.ERROR_403_URL);
    })

    it(`User with USER_WRITE permission should not be able to
        create a new user using an existing username`, () => {
        loginAsUserReadWrite();
        cy.visit(CONFIG.USER_URL);

        // Click on AllUsersShowMoreButton
        cy.get('.ant-btn > .anticon > svg').click()
        
        // Click on "Add User" in dropdown
        cy.get('.ant-dropdown-menu-item').click()

        cy.location('pathname').should('eq', addUserURL);

        // Fill in username field (with an existing username)
        cy.get(`#createNewUserForm_username`).click()
        cy.get(`#createNewUserForm_username`).type(`${users[0].username}{enter}`);

        // Fill in fields
        ['name', 'position', 'reportsTo', 'password'].map(field => {
            cy.get(`#createNewUserForm_${field}`).click()
            cy.get(`#createNewUserForm_${field}`).type(`${newUser[field]}{enter}`);
        })

        // Fill in permissions field
        for (let perm of newUser.permissions) {
            cy.get('#createNewUserForm_permissions').click()
            cy.get('#createNewUserForm_permissions').type(`${perm}{enter}`);
        }

        // Submit form and create new user
        cy.contains('Submit').click();

        // Should have error during submission
        cy.contains('Username is already taken');

        // Still on the add users page (but with the
        // error message for the username field)
        cy.location('pathname').should('eq', addUserURL);
        cy.location('pathname').should('not.eq', CONFIG.ERROR_400_URL);
    })
})