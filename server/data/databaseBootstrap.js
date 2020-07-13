const { PERMS } = require('../routes/api/v1/auth/permissions');
const { SO_STATES, PO_STATES } = require('./databaseEnum');

const users = [
    {
        // All Permissions User
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
        // Read Permissions User
        "username": "user3",
        "password": "asd",
        "permissions": [PERMS.USER_READ, PERMS.SUPPLIER_READ, PERMS.PART_READ, PERMS.CUSTOMER_READ],
        "name": "Gandalf",
        "position": "Sales Intern",
        "reportsTo": "user1"
    },
    {
        // Full Supplier and Part API Access
        "username": "user4",
        "password": "asd",
        "permissions": [PERMS.PART_READ, PERMS.PART_WRITE, PERMS.SUPPLIER_READ, PERMS.SUPPLIER_WRITE],
        "name": "Gandalf",
        "position": "Sales Intern",
        "reportsTo": "user1"
    },
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
        // Optional Supplier paths are absent, but with parts and without price history
        // Same parts as `A Industries`
        name: 'B Industries',
        address: 'Blk 321B Lorong Chuan Industrial Drive',
        parts: [
            {
                partNumber: 'PN121',
                priceHistory: [],
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
                status: 'ARCHIVED'
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

const customers = [
    {
        name: 'Flip-Flop Industries',
        address: 'Blk 281 9th Precinct Road',
        telephone: '+65 60752132',
        fax: '+65 65210213',
        email: 'flipflopswitches@gmail.com',
        pointOfContact: 'Jake Peralta',
        additionalInfo: 'Specialises in making flip-flop switches'
    },
    {
        name: 'Great Transistors Industries',
        address: 'Blk 786 Newtown Road',
        telephone: '+65 68261422',
        fax: '+65 65022112',
        email: 'greattransistors@gmail.com',
        pointOfContact: 'Amy Santiago',
        additionalInfo: 'Transistor quality approved using standard SME-201221'
    },
    {
        name: 'Harduino-Pi Inc.',
        address: 'Blk 809 Oldtown Avenue',
        telephone: '+65 67520921',
        fax: '+65 69021392',
        email: 'arduinoraspberry@gmail.com',
        pointOfContact: 'Charles Boyle',
    },
];
const numCustomerDataFillers = 10;
for (let i = 0; i < numCustomerDataFillers; i++) {
    let customer = {
        name: `No. ${i + 1} Customer`,
        address: `Blk 10${i} Customer Lane`,
        telephone: `+65 6892000${i}`,
        fax: `+65 6201089${i}`,
        email: `info@customer${i+1}.com`,
        pointOfContact: `Point of Contact ${i+1}`,
        additionalInfo: 'This was an auto-generated customer'
    }
    customers.push(customer);
}

const salesOrders = [
    {
        createdBy: users[0].username,
        latestStatus: SO_STATES.CONFIRMED,
        customer: customers[0].name,        // Must be translated into Customer ObjID
        additionalInfo: 'First Ever Sales Order!',
        orders: [
            {
                status: SO_STATES.QUOTATION,
                additionalInfo: 'Made a draft first. Pending confirmation with customer.',
                parts: [
                    {
                        partNumber: 'BA2132-21Z', // Must be translated into Part ObjID,
                        quantity: 1000,
                        additionalInfo: 'Urgent need for this part',
                        fulfilledBy: []     // In draft phase, supposed to be empty
                    },
                    {
                        partNumber: 'BA9871-21Z', // Must be translated into Part ObjID,
                        quantity: 800,
                        additionalInfo: 'Not so urgent need for this part',
                        fulfilledBy: []     // In draft phase, supposed to be empty
                    }
                ]
            },
            {
                status: SO_STATES.CONFIRMED,
                additionalInfo: 'Customer has confirmed part requirements',
                parts: [
                    {
                        partNumber: 'BA2132-21Z', // Must be translated into Part ObjID,
                        quantity: 1000,
                        additionalInfo: 'Urgent need for this part',
                        fulfilledBy: []     // In draft phase, supposed to be empty
                    },
                    {
                        partNumber: 'BA9871-21Z', // Must be translated into Part ObjID,
                        quantity: 800,
                        additionalInfo: 'Not so urgent need for this part',
                        fulfilledBy: []     // In draft phase, supposed to be empty
                    }
                ]
            }
        ]
    }
]

// TODO: Incorporate POs (into SOs)

module.exports = {
    users,
    suppliers,
    customers,
    salesOrders,
}