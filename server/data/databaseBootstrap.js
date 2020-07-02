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
    {
        // Supplier (Data Filler)
        name: 'E Industries',
        address: 'Blk 101A Woodlands Industrial Avenue',
        telephone: '+65 68093211',
        fax: '+65 62221321',
        additionalInfo: '5th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 5th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 5th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 5th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'F Industries',
        address: 'Blk 101B Woodlands Industrial Avenue',
        telephone: '+65 69193212',
        fax: '+65 63211321',
        additionalInfo: '6th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 6th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 6th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 6th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'G Industries',
        address: 'Blk 101C Woodlands Industrial Avenue',
        telephone: '+65 69993211',
        fax: '+65 62220000',
        additionalInfo: '7th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 7th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 7th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 7th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'H Industries',
        address: 'Blk 101D Woodlands Industrial Avenue',
        telephone: '+65 68096111',
        fax: '+65 62222222',
        additionalInfo: '8th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 8th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 8th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 8th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'I Industries',
        address: 'Blk 101E Woodlands Industrial Avenue',
        telephone: '+65 68793211',
        fax: '+65 62227721',
        additionalInfo: '9th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 9th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 9th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 9th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'J Industries',
        address: 'Blk 101F Woodlands Industrial Avenue',
        telephone: '+65 68720211',
        fax: '+65 63021321',
        additionalInfo: '10th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 10th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 10th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 10th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'K Industries',
        address: 'Blk 101G Woodlands Industrial Avenue',
        telephone: '+65 68765211',
        fax: '+65 62201321',
        additionalInfo: '11th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 11th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 11th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 11th Supplier'
        }]
    },
    {
        // Supplier (Data Filler)
        name: 'L Industries',
        address: 'Blk 101H Woodlands Industrial Avenue',
        telephone: '+65 67213211',
        fax: '+65 62221001',
        additionalInfo: '12th Suppliers',
        parts: [{
            partNumber: 'PN101',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 1 by 12th Supplier'
        }, {
            partNumber: 'PN102',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 2 by 12th Supplier'
        }, {
            partNumber: 'PN103',
            priceHistory: [{
                createdBy: `${users[0].username}`,
                unitPrice: 0.01
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.02
            }, {
                createdBy: `${users[0].username}`,
                unitPrice: 0.03
            }
            ], 
            description: 'Part 3 by 12th Supplier'
        }]
    }
]

module.exports = {
    users,
    suppliers
}