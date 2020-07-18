// All possible states for Sales Orders
const SO_STATES = Object.freeze({
    NEW: 'NEW',
    QUOTATION: 'QUOTATION',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    IN_DELIVERY: 'IN_DELIVERY',
    RECEIVED: 'RECEIVED',
    FULFILLED: 'FULFILLED',
})

// All possible states for Purchase Orders
const PO_STATES = Object.freeze({
    NEW: 'NEW',
    QUOTATION: 'QUOTATION',
    CONFIRMED: 'CONFIRMED',
    RECEIVED: 'RECEIVED',
    FULFILLED: 'FULFILLED',
})

module.exports = {
    SO_STATES,
    PO_STATES,
}