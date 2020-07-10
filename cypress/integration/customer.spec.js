const { users, customers } = require('../../server/data/databaseBootstrap');
import CONFIG from '../../client/src/config';
const { PERMS } = require('../../server/routes/api/v1/auth/permissions');

describe('Customer Flow', () => {
    const userReadWrite = users[0];
    const userRead = users[3];
    const userNoPerms = users[1];
    
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
        // Reset and Seed Customers Collection in Database
        cy.exec('RESET_DB_CUSTOMERS=true npm run cypress:reset_db');
    })

    /**
     * ----------------------------------
     * Authorization Checks (Page Access)
     * ----------------------------------
     */
    it(`User without any of the CUSTOMER permissions should not
        be able to access any of the customer-related URLs and
        should be redirected to the Error 403 page`, () => {
        loginAsUserNoPerms();

        // All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.location('pathname').should('not.eq', CONFIG.CUSTOMER_URL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Customer Details Page
        cy.visit(`${CONFIG.CUSTOMER_URL}/123`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Add Customer Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);
        cy.location('pathname').should('not.eq', `${CONFIG.CUSTOMER_URL}add`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);
    })

    it(`User with CUSTOMER_READ perm but not CUSTOMER_WRITE perm
        should be able to access the all customers page and perform
        only read actions`, () => {
        loginAsUserRead();

        // All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.location('pathname').should('eq', CONFIG.CUSTOMER_URL);

        // Show More Button should be disabled
        cy.get('.ant-btn')
          .should('be', 'disabled');

        // Should be able to access Customer Detail Page
        cy.contains('view').click();
        cy.location('pathname').should('match', /customers\/[a-z0-9]*$/);
    })

    it(`User with CUSTOMER_READ perm but not CUSTOMER_WRITE perm
        should be able to access the customer details page and perform
        only read actions`, () => {
        loginAsUserRead();

        // Navigate to Customer Detail Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.contains('view').click();

        // Show More Button should be disabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('be', 'disabled');

        // Edit Buttons should be disabled
        cy.contains('Edit')
          .should('be', 'disabled');
    })

    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perm should
        be able to access the all customers page and access page 
        to add a customer`, () => {
        loginAsUserReadWrite();

        // Navigate to All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.location('pathname').should('eq', CONFIG.CUSTOMER_URL);

        // Show More Button should be enabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('not.be', 'disabled')
          .and('exist');
        
        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Add a Customer Dropdown Menu Item
        cy.contains('Add a Customer')
          .click();
        
        // Customer Add Page
        cy.location('pathname').should('eq', `${CONFIG.CUSTOMER_URL}add`);
    })

    /**
     * -----------------
     * Delete a Customer
     * -----------------
     */
    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms should
        be able to access customer details page and delete the
        customer`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Details Page by clicking on 
        // the `view` button corresponding to `customers[0]`
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.get('table')
          .contains(customers[0].name) 
          .siblings()
          .contains('view')
          .click();

        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Delete Customer Dropdown Menu Item
        cy.contains('Delete Customer').click();

        // Modal should appear asking for confirmation
        cy.contains('Confirm').should('be.visible');
        cy.contains('Confirm').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .should('be.visible');

        // Customer should be deleted from table
        cy.contains(customers[0].name)
          .should('not.exist');
    })

    /**
     * ---------------------
     * Edit Customer Details
     * ---------------------
     */
    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms
        should be able to access customer details page and
        edit all fields (except customer name)`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Details Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.contains('view').click();

        // Customer Name should not be editable
        cy.contains('Customer Name')
          .contains('Edit')
          .should('not.exist');

        // Edit Address Field
        const newAddress = 'Cypress Test: New Address';
        // Click on Edit Button
        cy.contains('Address')
          .siblings()
          .contains('Edit')
          .click();
        // Enter New Address
        cy.contains('Address')
          .siblings()
          .find('input')
          .as('addressInput')
          .clear()
          .type(newAddress);
        // Click on Confirm Edit (Tick) Button
        cy.get('@addressInput')
          .siblings('button')
          .eq(1)
          .click();
        
        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Customer Information successfully changed!');

        // Edited User Details should be persisted
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.contains(newAddress);
    })

    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms
        should be able to edit customer details on customer
        details page and then choose to cancel the changes without
        persisting them`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Details Page
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.contains('view').click();

        // Edit Address Field
        const newAddress = 'Cypress Test: New Address';
        // Click on Edit Button
        cy.contains('Address')
            .siblings()
            .contains('Edit')
            .click();
        // Enter New Address
        cy.contains('Address')
            .siblings()
            .find('input')
            .as('addressInput')
            .clear()
            .type(newAddress);
        // Click on Cancel Edit (Cross) Button
        cy.get('@addressInput')
            .siblings('button')
            .eq(0)
            .click();
        
        // Edited User Details should NOT be persisted
        cy.visit(CONFIG.CUSTOMER_URL);
        cy.contains(newAddress)
          .should('not.exist');
    })

    /**
     * --------------
     * Add a Customer
     * --------------
     */
    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms should
        be able to create a new customer`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Add Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);

        // Fill in Customer Name
        const newCustomerName = 'Cypress Test: New Customer';
        cy.location('pathname').should('eq', `${CONFIG.CUSTOMER_URL}add`);
        cy.contains('Customer Name')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newCustomerName);
        // Fill in Point Of Contact
        const newPointOfContact = 'Cypress Test: Point of Contact';
        cy.contains('Point Of Contact')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newPointOfContact);

        // Click on Submit button
        cy.contains('Submit').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Successfully created new customer!');
        
        // Navigate to All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);

        // Search for new customer name in table
        cy.contains('Customer Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${newCustomerName}{enter}`);
        cy.contains(newCustomerName);
    })

    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms should
        not be able to create a new customer that has the same name
        as an existing customer`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Add Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);

        // Fill in Customer Name
        const newCustomerName = customers[0].name;
        cy.contains('Customer Name')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newCustomerName);
        // Fill in Point Of Contact
        const newPointOfContact = 'Cypress Test: Point of Contact';
        cy.contains('Point Of Contact')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newPointOfContact);

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message (validation) should appear
        cy.contains('A customer of the same name already exists');
    })

    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms should
        not be able to create a new customer without a customer name`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Add Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);
        
        // Fill in Point Of Contact
        const newPointOfContact = 'Cypress Test: Point of Contact';
        cy.contains('Point Of Contact')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newPointOfContact);

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message (validation) should appear
        cy.contains("Please input customer's name!");
    })

    it(`User with CUSTOMER_READ and CUSTOMER_WRITE perms should
        not be able to create a new customer without a point of contact`, () => {
        loginAsUserReadWrite();

        // Navigate to Customer Add Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);
        
        // Fill in Customer Name
        const newCustomerName = customers[0].name;
        cy.contains('Customer Name')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newCustomerName);

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message (validation) should appear
        cy.contains("Please input name of point of contact with customer!");
    })

    /**
     * ------------
     * Search Table
     * ------------
     */
    it(`For user with CUSTOMER_READ perms, when searching through 
        the filterable columns, a filter of the table's data should 
        be performed`, () => {
        loginAsUserRead();

        // Array format: [[column title, row value, input placeholder]]
        cy.wrap([['Customer Name', customers[0].name, 'name'], 
                 ['Address', customers[0].address, 'address'], 
                 ['Telephone', customers[0].telephone, 'telephone'], 
                 ['Additional Information', customers[0].additionalInfo, 'info']])
          .each(columnDetails => {
            // Navigate to All Customers Page
            cy.visit(CONFIG.CUSTOMER_URL);

            // Click on search icon for column
            cy.contains(columnDetails[0])
              .siblings()
              .eq(0)
              .click();
            // Enter search text
            cy.get(`[placeholder="Search ${columnDetails[2]}"]`)
              .clear()
              .type(`${columnDetails[1]}{enter}`);
            cy.get('table')
              .find('tr')
              .its('length')
              .should('eq', 2) // Header is also a <tr>
          })
    })

    it(`For user with CUSTOMER_READ perms, when searching through 
        the filterable columns, the table should switch back to the
        first page automatically`, () => {
        loginAsUserRead();

        // Navigate to All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-2 > a').click();

        // Perform a search on 'Customer Name' column
        cy.contains('Customer Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${customers[0].name}{enter}`);
        
        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })

    it(`For user with CUSTOMER_READ perms, when clearing the
        search filters, the table should switch back to the first
        page automatically and the table's rows should no longer
        have the search filter applied`, () => {
        loginAsUserRead();

        // Navigate to All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-2 > a').click();

        // Perform a search on 'Customer Name' column
        cy.contains('Customer Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${customers[0].name}{enter}`);
        cy.contains(customers[1].name)
          .should('not.exist');

        // Clear the search filter
        cy.contains('Customer Name')
          .siblings()
          .eq(0)
          .click();
        cy.contains('Clear')
          .click();

        // Table should have search filter cleared
        cy.contains(customers[1].name);

        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })


    /**
     * ----------
     * Navigation
     * ----------
     */
    it(`For user with CUSTOMER_READ perms, clicking on page 
        header back button in customer details page should bring 
        user back to the all customers page`, () => {
        loginAsUserRead();

        // Navigate to All Customers Page
        cy.visit(CONFIG.CUSTOMER_URL);

        // Navigate to Customer Details Page
        cy.contains('view').click();

        // Click on Page Header back button
        cy.get('.ant-page-header-back-button').click();
        cy.location('pathname').should('eq', CONFIG.CUSTOMER_URL);
    })

    it(`For user with CUSTOMER_WRITE perms, clicking on cancel 
        button in add customer page should bring user back to
        the all customers page`, () => {
        loginAsUserReadWrite();

        // Navigate to Add Customer Page
        cy.visit(`${CONFIG.CUSTOMER_URL}add`);

        // Click on Cancel Button
        cy.contains('Cancel').click();
        cy.location('pathname').should('eq', CONFIG.CUSTOMER_URL);
    })

})