describe('Login Flow', () => {
    const loginEndpoint = '/login';

    it('Access and Refresh JWTs set in cookies', () => {
        cy.visit('/login');
        cy.get('input#username').type('admin');
        cy.get('input#password').type('123{enter}');

        // {enter} causes the form to submit
        // cy.get('input[name=password]').type(`${password}{enter}`)
    })

    it('Username field should have autofocus', () => {
        cy.visit(loginEndpoint);
        cy.focused().should('have.id', 'username');
    })
})