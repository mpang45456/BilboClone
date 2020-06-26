const { PERMS } = require('../routes/api/v1/auth/permissions');

const users = [
    {
        "username": "admin",
        "password": "123",
        "permissions": Object.keys(PERMS), // All permissions enabled
        "name": "Bilbo Baggins",
        "position": "CEO",
        "reportsTo": "none"
    },
    {
        "username": "user1",
        "password": "asd",
        "permissions": [PERMS.USER_READ, PERMS.SALES_READ, PERMS.SALES_WRITE],
        "name": "Balin",
        "position": "Sales Representative",
        "reportsTo": "admin"
    },
    {
        "username": "user2",
        "password": "asd",
        "permissions": [PERMS.PURCHASES_READ, PERMS.PURCHASES_WRITE],
        "name": "Thorin",
        "position": "Customer Success Specialist",
        "reportsTo": "admin"
    },
    {
        "username": "user3",
        "password": "asd",
        "permissions": [PERMS.PURCHASES_READ, PERMS.SALES_READ],
        "name": "Gandalf",
        "position": "Sales Intern",
        "reportsTo": "user1"
    }
]

module.exports = {
    users
}