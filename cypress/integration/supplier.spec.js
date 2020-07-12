const { users, suppliers } = require('../../server/data/databaseBootstrap');
import CONFIG from '../../client/src/config';

describe('Supplier Flow', () => {
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
        // Reset and Seed Suppliers Collection in Database
        cy.exec('RESET_DB_SUPPLIERS_AND_PARTS=true npm run cypress:reset_db');
    })

    /**
     * ----------------------------------
     * Authorization Checks (Page Access)
     * ----------------------------------
     */
    it(`User without any of the SUPPLIER permissions should not
        be able to access any of the supplier-related URLs and
        should be redirected to the Error 403 page`, () => {
        loginAsUserNoPerms();

        // All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.location('pathname').should('not.eq', CONFIG.SUPPLIER_URL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Supplier Details Page
        cy.visit(`${CONFIG.SUPPLIER_URL}/123`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Add Supplier Page
        cy.visit(`${CONFIG.SUPPLIER_URL}add`);
        cy.location('pathname').should('not.eq', `${CONFIG.SUPPLIER_URL}add`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);
    })

    it(`User with SUPPLIER_READ perm but not SUPPLIER_WRITE perm
        should be able to access the all suppliers page and perform
        only read actions`, () => {
        loginAsUserRead();

        // All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.location('pathname').should('eq', CONFIG.SUPPLIER_URL);

        // Show More Button should be disabled
        cy.get('.ant-btn')
          .should('be', 'disabled');

        // Should be able to access Supplier Detail Page
        cy.contains('view').click();
        cy.location('pathname').should('match', /suppliers\/[a-z0-9]*$/);
    })

    it(`User with SUPPLIER_READ perm but not SUPPLIER_WRITE perm
        should be able to access the supplier details page and perform
        only read actions`, () => {
        loginAsUserRead();

        // Navigate to Supplier Detail Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.contains('view').click();

        // Show More Button should be disabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('be', 'disabled');

        // Edit Buttons should be disabled
        cy.contains('Edit')
          .should('be', 'disabled');
    })

    it(`User with SUPPLIER_READ and PART_READ perms but not PART_WRITE
        and SUPPLIER_WRITE perms should be able to access the supplier 
        details page and perform read-only actions in the parts table`, () => {
        loginAsUserRead();

        // Navigate to Supplier Detail Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.contains('view').click();

        // Show More Button in `All Parts` Tab should be disabled
        cy.get('.ant-tabs-extra-content > .ant-btn')
        .should('be', 'disabled');
    })

    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perm should
        be able to access the all suppliers page and access page 
        to add a supplier`, () => {
        loginAsUserReadWrite();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.location('pathname').should('eq', CONFIG.SUPPLIER_URL);

        // Show More Button should be enabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('not.be', 'disabled')
          .and('exist');
        
        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Add a Supplier Dropdown Menu Item
        cy.contains('Add a Supplier')
          .click();
        
        // Supplier Add Page
        cy.location('pathname').should('eq', `${CONFIG.SUPPLIER_URL}add`);
    })

    /**
     * -----------------
     * Delete a Supplier
     * -----------------
     */
    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms should
        be able to access supplier details page and delete the
        supplier`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Details Page by clicking on 
        // the `view` button corresponding to `suppliers[0]`
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.get('table')
          .contains(suppliers[0].name) 
          .siblings()
          .contains('view')
          .click();

        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Delete Supplier Dropdown Menu Item
        cy.contains('Delete Supplier').click();

        // Modal should appear asking for confirmation
        cy.contains('Confirm').should('be.visible');
        cy.contains('Confirm').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Successfully deleted supplier!');

        // Supplier should be deleted from table
        cy.contains(suppliers[0].name)
          .should('not.exist');
    })

    /**
     * ---------------------
     * Edit Supplier Details
     * ---------------------
     */
    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms
        should be able to access supplier details page and
        edit all fields (except supplier name)`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Details Page
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.contains('view').click();

        // Supplier Name should not be editable
        cy.contains('Supplier Name')
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
          .should('have.text', 'Supplier Information successfully changed!');

        // Edited User Details should be persisted
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.contains(newAddress);
    })

    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms
        should be able to edit supplier details on supplier
        details page and then choose to cancel the changes without
        persisting them`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Details Page
        cy.visit(CONFIG.SUPPLIER_URL);
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
        cy.visit(CONFIG.SUPPLIER_URL);
        cy.contains(newAddress)
          .should('not.exist');
    })

    /**
     * --------------------------------------
     * Viewing Parts in Supplier Details Page
     * --------------------------------------
     */
    it(`User with SUPPLIER_READ and PART_READ perms should
        be able to view parts details and perform a search
        on its columns`, () => {
        loginAsUserRead();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL)

        // Navigate to Supplier Details Page
        cy.contains(suppliers[3].name)
          .siblings()
          .contains('view')
          .click();
        
        // Perform a search on 'Part Number' column
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.get(`[placeholder="Search part number"]`)
          .clear()
          .type(`${suppliers[3].parts[0].partNumber}{enter}`);
        cy.wrap([suppliers[3].parts[1].partNumber, 
                 suppliers[3].parts[2].partNumber])
          .each(partNumber => {
              cy.contains(partNumber)
                .should('not.exist');
          })

        // Clear the search filter
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.contains('Clear')
          .click();
        
        // All original table rows should now be present again
        cy.wrap(suppliers[3].parts)
          .each(part => {
              cy.contains(part.partNumber);
          })
    })

    it(`User with SUPPLIER_READ and PART_READ perms should
        be able to navigate to part details page from the parts
        table in the supplier details page`, () => {
        loginAsUserRead();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL)

        // Navigate to Supplier Details Page
        cy.contains(suppliers[3].name)
          .siblings()
          .contains('view')
          .click();

        // Click on `view` button in parts table
        cy.contains('view').click();

        // Should have navigated to Part Details Page
        cy.location('pathname').should('match', /parts\/[a-z0-9]*$/);
    })

    it(`User with SUPPLIER_READ and PART_WRITE perms should
        be able to navigate to add a part page from the parts
        table in the supplier details page`, () => {
        loginAsUserReadWrite();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL)

        // Navigate to Supplier Details Page
        cy.contains(suppliers[3].name)
          .siblings()
          .contains('view')
          .click();

        // Click on Show More Button in `All Parts` tab
        cy.get('.ant-tabs-extra-content > .ant-btn').click()
        cy.contains('Add a Part').click();

        // Should have navigated to Add Part Page
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);
    })

    /**
     * --------------
     * Add a Supplier
     * --------------
     */
    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms should
        be able to create a new supplier`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Add Page
        cy.visit(`${CONFIG.SUPPLIER_URL}add`);
        cy.location('pathname').should('eq', `${CONFIG.SUPPLIER_URL}add`);

        // Fill in Supplier Name
        const newSupplierName = 'Cypress Test: New Supplier';
        cy.contains('Supplier Name')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newSupplierName);

        // Click on Submit button
        cy.contains('Submit').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Successfully created new supplier!');
        
        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);

        // Search for new supplier name in table
        cy.contains('Supplier Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${newSupplierName}{enter}`);
        cy.contains(newSupplierName);
    })

    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms should
        not be able to create a new supplier that has the same name
        as an existing supplier`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Add Page
        cy.visit(`${CONFIG.SUPPLIER_URL}add`);

        // Fill in Supplier Name
        const newSupplierName = suppliers[0].name;
        cy.contains('Supplier Name')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newSupplierName);

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message (validation) should appear
        cy.contains('A supplier of the same name already exists');
    })

    it(`User with SUPPLIER_READ and SUPPLIER_WRITE perms should
        not be able to create a new supplier without a supplier name`, () => {
        loginAsUserReadWrite();

        // Navigate to Supplier Add Page
        cy.visit(`${CONFIG.SUPPLIER_URL}add`);
        
        // Click on Submit button
        cy.contains('Submit').click();

        // Error message (validation) should appear
        cy.contains("Please input supplier's name!");
    })

    /**
     * ------------
     * Search Table
     * ------------
     */
    it(`For user with SUPPLIER_READ perms, when searching through 
        the filterable columns, a filter of the table's data should 
        be performed`, () => {
        loginAsUserRead();

        // Array format: [[column title, row value, input placeholder]]
        cy.wrap([['Supplier Name', suppliers[0].name, 'name'], 
                 ['Address', suppliers[0].address, 'address'], 
                 ['Telephone', suppliers[0].telephone, 'telephone'], 
                 ['Additional Information', suppliers[0].additionalInfo, 'info']])
          .each(columnDetails => {
            // Navigate to All Suppliers Page
            cy.visit(CONFIG.SUPPLIER_URL);

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

    it(`For user with SUPPLIER_READ perms, when searching through 
        the filterable columns, the table should switch back to the
        first page automatically`, () => {
        loginAsUserRead();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-2 > a').click();

        // Perform a search on 'Supplier Name' column
        cy.contains('Supplier Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${suppliers[0].name}{enter}`);
        
        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })

    it(`For user with SUPPLIER_READ perms, when clearing the
        search filters, the table should switch back to the first
        page automatically and the table's rows should no longer
        have the search filter applied`, () => {
        loginAsUserRead();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-2 > a').click();

        // Perform a search on 'Supplier Name' column
        cy.contains('Supplier Name')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${suppliers[0].name}{enter}`);
        cy.contains(suppliers[1].name)
          .should('not.exist');

        // Clear the search filter
        cy.contains('Supplier Name')
          .siblings()
          .eq(0)
          .click();
        cy.contains('Clear')
          .click();

        // Table should have search filter cleared
        cy.contains(suppliers[1].name);

        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })


    /**
     * ----------
     * Navigation
     * ----------
     */
    it(`For user with SUPPLIER_READ perms, clicking on page 
        header back button in supplier details page should bring 
        user back to the all suppliers page`, () => {
        loginAsUserRead();

        // Navigate to All Suppliers Page
        cy.visit(CONFIG.SUPPLIER_URL);

        // Navigate to Supplier Details Page
        cy.contains('view').click();

        // Click on Page Header back button
        cy.get('.ant-page-header-back-button').click();
        cy.location('pathname').should('eq', CONFIG.SUPPLIER_URL);
    })

    it(`For user with SUPPLIER_WRITE perms, clicking on cancel 
        button in add supplier page should bring user back to
        the all suppliers page`, () => {
        loginAsUserReadWrite();

        // Navigate to Add Supplier Page
        cy.visit(`${CONFIG.SUPPLIER_URL}add`);

        // Click on Cancel Button
        cy.contains('Cancel').click();
        cy.location('pathname').should('eq', CONFIG.SUPPLIER_URL);
    })

})