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
        "permissions": [PERMS.SALES_READ, PERMS.SALES_WRITE],
        "name": "Balin",
        "position": "Sales Representative",
        "reportsTo": "admin"
    },
    {
        "username": "user2",
        "password": "asd",
        "permissions": [PERMS.USER_READ, PERMS.PURCHASES_READ, PERMS.PURCHASES_WRITE],
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

const suppliers = [
    {
        name: 'A Industries',
        address: 'Blk 604A Tuas Industrial Avenue',
        telephone: '+65 60829213',
        fax: '+65 69421245',
        parts: [
            {
                partNumber: 'PN121',
                priceHistory: [{
                    createdBy: 'brian',
                    unitPrice: 0.0001,
                    additionalInfo: 'Cheap Product'
                }],
                description: 'A hammer',
                status: 'ACTIVE',
                additionalInfo: 'Supplier will stop manufacturing this part on 30/8/2020'
            }
        ],
        additionalInfo: 'A well-regarded business partner since the 1970s'
    }
]

module.exports = {
    users,
    suppliers
}