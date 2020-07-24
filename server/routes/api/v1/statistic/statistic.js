const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const logger = require('../../../../utils');
const { UserModel,
        SalesOrderModel, 
        SalesOrderStateModel, 
        PurchaseOrderModel, 
        PurchaseOrderStateModel } = require('../../../../data/database');
const { SO_STATES, PO_STATES } = require('../../../../data/databaseEnum');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { setUserHierarchy } = require('../user/hierarachy');
const { PERMS } = require('../auth/permissions');

// Router Set-Up
router.use(isAuthenticated);

/**
 * Mounted on /api/v1/statistic
 * 
 * Compiles and returns the total value
 * value of sales orders and purchase orders
 * created by users in the requesting user's
 * user hierarchy. In other words, the requesting
 * user can only see compiled statistics
 * for users in its user hierarchy. 
 * 
 * Query Parameters can specify:
 * 1. `salesOrderStatus`
 *    - default: `SO_STATES.FULFILLED`
 *    - This filters for sales orders that have
 *      the particular status for statistics
 *      compilation 
 * 2. `purchaseOrderStatus`
 *    - default: `PO_STATES.FULFILLED`
 *    - similar to `salesOrderStatus`
 * 3. `timeStart`
 *    - default: null
 *    - Filters for sales and purchase orders
 *      whose `updatedAt` field is greater than 
 *      than or equal to `timeStart`
 * 4. `timeEnd`
 *    - default: null
 *    - Filters for sales and purchase orders
 *      whose `updatedAt` field is less then
 *      `timeEnd`.
 *    - Note that this is a non-inclusive bound
 *      (i.e. it is `<`, not `<=`)
 * 
 * The response body has the following format:
 * {
 *      username: {
 *          salesOrders: [{
 *              orderNumber: String
 *              totalValue: Number
 *          }],
 *          purchaseOrders: [{
 *              orderNumber: String
 *              totalValue: Number
 *          }],
 *          name: String (actual name of user)
 *      }
 * }
 */
router.get('/', 
           isAuthorized(PERMS.STATISTICS_READ),
           setUserHierarchy, 
           async function(req, res) {
    
    let {
        salesOrderStatus = SO_STATES.FULFILLED,
        purchaseOrderStatus = PO_STATES.FULFILLED,
        timeStart = null,
        timeEnd = null,
    } = req.query;
    
    resBody = {};
    // Compile statistics for each user in user hierarchy
    await Promise.all(req.userHierarchy.map(async username => {
        let orderMongooseQuery = {createdBy: username};
        if (timeStart && timeEnd) {
            orderMongooseQuery.updatedAt = {
                $gte: timeStart, 
                $lt: timeEnd
            }
        }
        // Prepare Sales Order Statistics
        const soStatistic = { salesOrders: [] };
        const soDocs = await SalesOrderModel.find({ ...orderMongooseQuery, latestStatus: salesOrderStatus });
        await Promise.all(soDocs.map(async soDoc => {
            const soLatestStateDoc = await SalesOrderStateModel.findOne({ _id: soDoc.orders[soDoc.orders.length - 1]})
                                                               .populate('parts.part');
            
            let totalValue = 0;
            soLatestStateDoc.parts.map(partInfo => {
                const latestPriceHistory = partInfo.part.priceHistory[partInfo.part.priceHistory.length - 1];
                totalValue += partInfo.quantity * latestPriceHistory.unitPrice;
            })
            const statistic = {
                orderNumber: soDoc.orderNumber,
                totalValue: totalValue,
            }
            soStatistic.salesOrders.push(statistic);
        }))
        resBody[username] = soStatistic;

        // Prepare Purchase Order Statistics
        const poStatistic = { purchaseOrders: [] };
        const poDocs = await PurchaseOrderModel.find({ ...orderMongooseQuery, latestStatus: purchaseOrderStatus });
        await Promise.all(poDocs.map(async poDoc => {
            const poLatestStateDoc = await PurchaseOrderStateModel.findOne({ _id: poDoc.orders[poDoc.orders.length - 1]})
                                                                  .populate('parts.part');
            
            let totalValue = 0;
            poLatestStateDoc.parts.map(partInfo => {
                const latestPriceHistory = partInfo.part.priceHistory[partInfo.part.priceHistory.length - 1];
                totalValue += partInfo.quantity * latestPriceHistory.unitPrice;
            })
            const statistic = {
                orderNumber: poDoc.orderNumber,
                totalValue: totalValue,
            }
            poStatistic.purchaseOrders.push(statistic);
        }))
        resBody[username].purchaseOrders = poStatistic.purchaseOrders;

        // Prepare actual name of user
        const userDoc = await UserModel.findOne({ username });
        resBody[username].name = userDoc.name;
    }));
    
    res.send(resBody);
})

module.exports = {
    statisticRouter: router,
}


