import React from 'react';
import { BilboDividerWithText } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.CANCELLED` status.
 */
export default function SalesOrderCancelledContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order has been cancelled. This record is just for archival purposes.</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />
        </>
    )
}
SalesOrderCancelledContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}
