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
        "permissions": [PERMS.SUPPLIER_READ, PERMS.PART_READ],
        "name": "Gandalf",
        "position": "Sales Intern",
        "reportsTo": "user1"
    }
]

// 12 suppliers (4 + 8 Data Fillers)
// 29 parts (1 + 1 + 0 + 3 + 8 * 3)
const suppliers = [
    {
        // Complete with all fields
        name: 'A Industries',
        address: 'Blk 604A Tuas Industrial Avenue',
        telephone: '+65 60829213',
        fax: '+65 69421245',
        parts: [
            {
                partNumber: 'PN121',
                priceHistory: [{
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.0001,
                    additionalInfo: 'Cheap Product'
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.0002,
                    additionalInfo: 'Product price double owing to supply constraints'
                }],
                description: 'A hammer',
                status: 'ACTIVE',
                additionalInfo: 'Supplier will stop manufacturing this part on 30/8/2020'
            }
        ],
        additionalInfo: 'A well-regarded business partner since the 1970s'
    },
    {
        // Optional Supplier paths are absent, but with parts and price history
        // Same parts as `A Industries`
        name: 'B Industries',
        address: 'Blk 321B Lorong Chuan Industrial Drive',
        parts: [
            {
                partNumber: 'PN121',
                priceHistory: [{
                    createdBy: 'brian',
                    unitPrice: 0.0001,
                    additionalInfo: 'Cheap Product'
                }],
                description: 'A nail',
                status: 'ACTIVE',
                additionalInfo: 'Supplier will stop manufacturing this part on 30/8/2020'
            }
        ],
        additionalInfo: 'Owner might be retiring soon'
    },
    {
        // Only supplier information, and without parts and price history
        name: 'C Industries',
        address: 'Blk 98D Jurong Port Drive',
        telephone: '+65 68093214',
        fax: '+65 62102312',
        additionalInfo: 'Able to obtain supplies from ASEAN',
        parts: []
    },
    {
        // Complete with all fields and multiple parts and price history
        name: 'D Industries',
        address: 'Blk 39A Marsiling Industrial Town',
        telephone: '+65 67341231',
        fax: '+65 60924123',
        parts: [
            {
                partNumber: 'BA2132-21Z',
                priceHistory: [{
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.00015,
                    additionalInfo: 'Price stands at $15/10000 units'
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.00001,
                    additionalInfo: 'Steep discount if purchased together with part PN121'
                }],
                description: 'An Arduino Board',
                status: 'ACTIVE',
            },
            {
                partNumber: 'BA9871-21Z',
                priceHistory: [{
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.023,
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.040,
                    additionalInfo: 'Increase in price owing to disruption in supply chain'
                }],
                description: 'RFID receiver',
            },
            {
                partNumber: 'BA2133-21Z',
                priceHistory: [{
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.023,
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.020,
                    additionalInfo: 'Slight drop in price since last quotation'
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.023,
                    additionalInfo: 'Slight increase in price since last quotation'
                }, {
                    createdBy: `${users[0].username}`,
                    unitPrice: 0.040,
                    additionalInfo: 'Increase in price owing to disruption in supply chain, similar to part BA9871-21Z. Willing to offer a discount if both items are purchased in bulk (in excess of 100 000 units)'
                }],
                description: 'RFID transmitter',
            },

        ],
        additionalInfo: 'Usually offers steep discounts if multiple components are purchased in bulk'
    },
]
const numSupplierDataFillers = 8;
for (let i = 0; i < numSupplierDataFillers; i++) {
    let supplier = {
        name: `No. ${i+1} Industries`,
        address: `Blk 10${i} Woodlands Industrial Avenue`,
        telephone: `+65 6210000${i}`,
        fax: `+65 6310000${i}`,
        additionalInfo: `${i+1}-th Suppliers`,
    }
    supplier.parts = [];
    for (let j = 0; j < 3; j++) {
        supplier.parts.push({
            partNumber: `PN10${j}`,
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }],
            description: `Part ${j} by ${i+1}-th Supplier`
        })
    }
    suppliers.push(supplier);
}

module.exports = {
    users,
    suppliers
}