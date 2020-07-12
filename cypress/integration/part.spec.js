const { users, suppliers } = require('../../server/data/databaseBootstrap');
import CONFIG from '../../client/src/config';

describe('Part Flow', () => {
    const userReadWrite = users[0];
    const userRead = users[3];
    const userNoPerms = users[1];
    const newPart = {
        supplierName: suppliers[0].name,
        partNumber: 'PN-131',
        description: 'Cypress Test: Description',
        status: 'ACTIVE',
        additionalInfo: 'Cypress Test: Additional Info'
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
        // Reset and Seed Parts Collection in Database
        cy.exec('RESET_DB_SUPPLIERS_AND_PARTS=true npm run cypress:reset_db');
    })

    /**
     * ----------------------------------
     * Authorization Checks (Page Access)
     * ----------------------------------
     */
    it(`User without any of the PART permissions should not
        be able to access any of the part-related URLs and
        should be redirected to the Error 403 page`, () => {
        loginAsUserNoPerms();

        // All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        cy.location('pathname').should('not.eq', CONFIG.PARTS_URL);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Part Details Page
        cy.visit(`${CONFIG.PARTS_URL}/123`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);

        // Add Part Page
        cy.visit(`${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('not.eq', `${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('eq', CONFIG.ERROR_403_URL);
    })

    it(`User with PART_READ perm but not PART_WRITE perm
        should be able to access the all parts page and perform
        only read actions`, () => {
        loginAsUserRead();

        // All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        cy.location('pathname').should('eq', CONFIG.PARTS_URL);

        // Show More Button should be disabled
        cy.get('.ant-btn')
          .should('be', 'disabled');

        // Should be able to access Part Detail Page
        cy.contains('view').click();
        cy.location('pathname').should('match', /parts\/[a-z0-9]*$/);
    })

    it(`User with PART_READ perm but not PART_WRITE perm
        should be able to access the part details page and perform
        only read actions`, () => {
        loginAsUserRead();

        // Navigate to Part Detail Page
        cy.visit(CONFIG.PARTS_URL);
        cy.contains('view').click();

        // Show More Button should be disabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('be', 'disabled');

        // Edit Buttons should be disabled
        cy.contains('Edit')
          .should('be', 'disabled');
    })

    it(`User with PART_READ and PART_WRITE perm should
        be able to access the all parts page and access page 
        to add a part`, () => {
        loginAsUserReadWrite();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        cy.location('pathname').should('eq', CONFIG.PARTS_URL);

        // Show More Button should be enabled
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .should('not.be', 'disabled')
          .and('exist');
        
        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Add a Part Dropdown Menu Item
        cy.contains('Add a Part')
          .click();
        
        // Part Add Page
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);
    })

    /**
     * -----------------
     * Delete a Part
     * -----------------
     */
    it(`User with PART_READ and PART_WRITE perms should
        be able to access part details page and delete the
        part`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Details Page by clicking on 
        // the `view` button corresponding to `parts[0]`
        cy.visit(CONFIG.PARTS_URL);
        cy.get('table')
          .contains(suppliers[0].parts[0].description) 
          .siblings()
          .contains('view')
          .click();

        // Click on Show More Button
        cy.get('.ant-page-header-heading-extra > .ant-btn')
          .click();
        
        // Click on Delete Part Dropdown Menu Item
        cy.contains('Delete Part').click();

        // Modal should appear asking for confirmation
        cy.contains('Confirm').should('be.visible');
        cy.contains('Confirm').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Successfully deleted part!');

        // Part should be deleted from table
        cy.contains(suppliers[0].parts[0].description)
          .should('not.exist');
    })

    /**
     * ---------------------
     * Edit Part Details
     * ---------------------
     */
    it(`User with PART_READ and PART_WRITE perms
        should be able to access part details page and
        edit all fields (except supplier name)`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Details Page
        cy.visit(CONFIG.PARTS_URL);
        cy.contains('view').click();

        // Part Name should not be editable
        cy.contains('Supplier Name')
          .contains('Edit')
          .should('not.exist');

        // Edit Description Field
        const newDescription = 'Cypress Test: New Description';
        // Click on Edit Button
        cy.contains('Description')
          .siblings()
          .contains('Edit')
          .click();
        // Enter New Description
        cy.contains('Description')
          .siblings()
          .find('textarea')
          .as('descriptionInput')
          .clear()
          .type(newDescription);
        // Click on Confirm Edit (Tick) Button
        cy.get('@descriptionInput')
          .siblings('button')
          .eq(1)
          .click();
        
        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Part Information successfully changed!');

        // Edited User Details should be persisted
        cy.visit(CONFIG.PARTS_URL);
        cy.contains(newDescription);
    })

    it(`User with PART_READ and PART_WRITE perms
        should be able to edit part details on part
        details page and then choose to cancel the changes
        without persisting them`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Details Page
        cy.visit(CONFIG.PARTS_URL);
        cy.contains('view').click();

        // Edit Description Field
        const newDescription = 'Cypress Test: New Description';
        // Click on Edit Button
        cy.contains('Description')
            .siblings()
            .contains('Edit')
            .click();
        // Enter New Description
        cy.contains('Description')
            .siblings()
            .find('textarea')
            .as('descriptionInput')
            .clear()
            .type(newDescription);
        // Click on Cancel Edit (Cross) Button
        cy.get('@descriptionInput')
            .siblings('button')
            .eq(0)
            .click();
        
        // Edited User Details should NOT be persisted
        cy.visit(CONFIG.PARTS_URL);
        cy.contains(newDescription)
          .should('not.exist');
    })

    /**
     * ----------------------------------
     * Price History in Part Details Page
     * ----------------------------------
     */
    it(`User with PART_READ perm should not be able to
        create a new price history entry when there is 
        no price history information available`, () => {
        loginAsUserRead();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        
        // Click on Part with No Price History Information
        cy.contains(suppliers[1].name)
          .siblings()
          .contains('view')
          .click();

        // Add Price History Button should be disabled
        cy.contains('No price history information available')
          .siblings()
          .find('button')
          .parent()
          .should('have.attr', 'style', 'pointer-events: none; opacity: 0.4;');
    })

    it(`User with PART_READ perm should not be able to
        create a new price history entry when there is
        price history information available`, () => {
        loginAsUserRead();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        
        // Click on Part with Price History Information
        cy.contains(suppliers[0].name)
          .siblings()
          .contains('view')
          .click();

        // Add Price History Button should be disabled
        cy.get('.ant-timeline-item-head.ant-timeline-item-head-custom.ant-timeline-item-head-blue')
          .find('button')
          .parent()
          .should('have.attr', 'style', 'pointer-events: none; opacity: 0.4;');
    })

    it(`User with PART_READ and PART_WRITE perms should be 
        able to create a new price history entry when there is 
        no price history information available`, () => {
        loginAsUserReadWrite();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        
        // Click on Part with No Price History Information
        cy.contains(suppliers[1].name)
          .siblings()
          .contains('view')
          .click();

        // Click on Add Price History Button
        cy.contains('No price history information available')
          .siblings()
          .find('button')
          .parent()
          .click();

        // Modal should be displayed
        cy.get('.ant-modal-content')
          .should('be.visible');

        // Enter Price Information
        const newPrice = '123';
        cy.get('#unitPrice')
          .clear()
          .type(newPrice)
        const newAdditionalInfo = 'Cypress Test: Additional Information';
        cy.get('#priceAdditionalInfo')
          .clear()
          .type(newAdditionalInfo);
        
        // Submit Price Information
        cy.contains('Confirm').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'New Price Information added!');

        // Newly-added Price Information should be persisted
        cy.contains(newPrice);
        cy.contains(newAdditionalInfo);
        cy.contains(userReadWrite.username);
    })

    it(`User with PART_READ and PART_WRITE perms should be 
        able to create a new price history entry when there is 
        price history information available`, () => {
        loginAsUserReadWrite();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);
        
        // Click on Part with Price History Information
        cy.contains(suppliers[0].name)
          .siblings()
          .contains('view')
          .click();

        // Click on Add Price History Button
        cy.get('.ant-timeline-item-head.ant-timeline-item-head-custom.ant-timeline-item-head-blue')
          .find('button')
          .click();

        // Modal should be displayed
        cy.get('.ant-modal-content')
          .should('be.visible');

        // Enter Price Information
        const newPrice = '123';
        cy.get('#unitPrice')
          .clear()
          .type(newPrice)
        const newAdditionalInfo = 'Cypress Test: Additional Information';
        cy.get('#priceAdditionalInfo')
          .clear()
          .type(newAdditionalInfo);
        
        // Submit Price Information
        cy.contains('Confirm').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'New Price Information added!');

        // Newly-added Price Information should be persisted
        cy.contains(newPrice);
        cy.contains(newAdditionalInfo);
        cy.contains(newAdditionalInfo)
          .siblings()
          .find('strong')
          .should('have.text', `- ${userReadWrite.username}`);
    })

    /**
     * ----------
     * Add a Part
     * ----------
     */
    it(`User with PART_READ and PART_WRITE perms should
        be able to create a new part`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Add Page
        cy.visit(`${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);

        // Fill in Supplier Name
        cy.contains('Supplier Name')
          .parent()
          .siblings()
          .find('input')
          .click()
          .type(newPart.supplierName);
        cy.contains(newPart.supplierName)
          .click();

        // Fill in Part Number
        cy.contains('Part Number')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newPart.partNumber);

        // Fill in Status
        cy.contains('Status')
          .parent()
          .siblings()
          .find('input')
          .click()
        cy.get('.ant-select-item-option-content')
          .contains('ACTIVE')
          .click();

        // Click on Submit button
        cy.contains('Submit').click();

        // Confirmation message should appear
        cy.get('.ant-message-notice-content')
          .as('confirmationMessage')
          .should('be.visible');
        cy.get('@confirmationMessage')
          .should('have.text', 'Successfully created new part!');

        // Redirected to All Parts Page
        cy.location('pathname').should('eq', CONFIG.PARTS_URL);

        // Search for new part in table
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${newPart.partNumber}{enter}`);
        cy.contains(newPart.partNumber);
    })

    it(`User with PART_READ and PART_WRITE perms should
        not be able to create a new part without a supplier
        name`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Add Page
        cy.visit(`${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);

        // Fill in Part Number
        cy.contains('Part Number')
          .parent()
          .siblings()
          .find('input')
          .clear()
          .type(newPart.partNumber);

        // Fill in Status
        cy.contains('Status')
          .parent()
          .siblings()
          .find('input')
          .click()
        cy.get('.ant-select-item-option-content')
          .contains('ACTIVE')
          .click();

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message should appear
        cy.contains("Please input supplier's name!");
    })

    it(`User with PART_READ and PART_WRITE perms should
        not be able to create a new part without a part
        number`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Add Page
        cy.visit(`${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);

        // Fill in Supplier Name
        cy.contains('Supplier Name')
          .parent()
          .siblings()
          .find('input')
          .click()
          .type(newPart.supplierName);
        cy.contains(newPart.supplierName)
          .click();

        // Fill in Status
        cy.contains('Status')
          .parent()
          .siblings()
          .find('input')
          .click()
        cy.get('.ant-select-item-option-content')
          .contains('ACTIVE')
          .click();

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message should appear
        cy.contains("Please input part number!");
    })

    it(`User with PART_READ and PART_WRITE perms should
        not be able to create a new part without a part
        status`, () => {
        loginAsUserReadWrite();

        // Navigate to Part Add Page
        cy.visit(`${CONFIG.PARTS_URL}add`);
        cy.location('pathname').should('eq', `${CONFIG.PARTS_URL}add`);

        // Fill in Supplier Name
        cy.contains('Supplier Name')
          .parent()
          .siblings()
          .find('input')
          .click()
          .type(newPart.supplierName);
        cy.contains(newPart.supplierName)
          .click();

        // Fill in Part Number
        cy.contains('Part Number')
        .parent()
        .siblings()
        .find('input')
        .clear()
        .type(newPart.partNumber);

        // Click on Submit button
        cy.contains('Submit').click();

        // Error message should appear
        cy.contains("Please select part status!");
    })

    /**
     * ------------
     * Search Table
     * ------------
     */
    it(`For user with PART_READ perms, when searching through 
        the filterable columns, a filter of the table's data should 
        be performed`, () => {
        loginAsUserRead();

        // Array format: [[column title, row value, input placeholder]]
        cy.wrap([['Part Number', suppliers[3].parts[1].partNumber, 'part number'], 
                 ['Description', suppliers[3].parts[1].description, 'description'], 
                 ['Status', suppliers[3].parts[1].status, 'status'],
                 ['Additional Information', suppliers[3].parts[1].additionalInfo, 'info']])
          .each(columnDetails => {
            // Navigate to All Parts Page
            cy.visit(CONFIG.PARTS_URL);

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

    it(`For user with PART_READ perms, when searching through 
        the filterable columns, the table should switch back to the
        first page automatically`, () => {
        loginAsUserRead();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-3 > a').click();

        // Perform a search on 'Part Number' column
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${suppliers[3].parts[1].partNumber}{enter}`);
        
        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })

    it(`For user with PART_READ perms, when clearing the
        search filters, the table should switch back to the first
        page automatically and the table's rows should no longer
        have the search filter applied`, () => {
        loginAsUserRead();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);

        // Select last page of table
        cy.get('.ant-pagination-item-3 > a').click();

        // Perform a search on 'Part Name' column
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.get('.ant-input')
          .clear()
          .type(`${suppliers[3].parts[1].partNumber}{enter}`);
        cy.contains(suppliers[0].parts[0].partNumber)
          .should('not.exist');

        // Clear the search filter
        cy.contains('Part Number')
          .siblings()
          .eq(0)
          .click();
        cy.contains('Clear')
          .click();

        // Table should have search filter cleared
        cy.contains(suppliers[0].parts[0].partNumber);

        // Table should be at first page
        cy.get('.ant-pagination-item-active')
          .should('have.text', '1');
    })


    /**
     * ----------
     * Navigation
     * ----------
     */
    it(`For user with PART_READ perms, clicking on page 
        header back button in part details page should bring 
        user back to the all parts page`, () => {
        loginAsUserRead();

        // Navigate to All Parts Page
        cy.visit(CONFIG.PARTS_URL);

        // Navigate to Part Details Page
        cy.contains('view').click();

        // Click on Page Header back button
        cy.get('.ant-page-header-back-button').click();
        cy.location('pathname').should('eq', CONFIG.PARTS_URL);
    })

    it(`For user with PART_WRITE perms, clicking on cancel 
        button in add part page should bring user back to
        the all parts page`, () => {
        loginAsUserReadWrite();

        // Navigate to Add Part Page
        cy.visit(`${CONFIG.PARTS_URL}add`);

        // Click on Cancel Button
        cy.contains('Cancel').click();
        cy.location('pathname').should('eq', CONFIG.PARTS_URL);
    })

})