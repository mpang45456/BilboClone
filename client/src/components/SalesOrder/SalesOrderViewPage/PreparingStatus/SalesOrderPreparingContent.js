import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.PREPARING` status.
 * 
 * Note: Only warehouse users will be able to progress
 * the sales order to the next status (`SO_STATES.IN_DELIVERY`).
 * Hence, this component is relatively 'dumb', and simply
 * displays text and the current sales order data.
 */
export default function SalesOrderPreparingContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order is currently being prepared. Warehouse will change Sales Order status once order has been shipped for delivery</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />
        </>
    )
}
SalesOrderPreparingContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}