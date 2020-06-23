describe('Login Flow', () => {
    it('Access and Refresh JWTs set in cookies', () => {
        cy.visit('/login');
        cy.get('input[name=username]').type(username)

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`${password}{enter}`)
    })
})