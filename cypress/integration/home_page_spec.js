const { default: Item } = require("antd/lib/list/Item")

describe('The Home Page', () => {
    it('successfully loads', () => {
        cy.visit('/settings')
    })
})