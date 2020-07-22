import React from 'react';
import { BilboDividerWithText,
         BilboDivider } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';
import ConfirmAndProceedButton from '../ConfirmAndProceedButton';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.FULFILLED` status.
 */
export default function SalesOrderFulfilledContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order has been fulfilled. This record is just for archival purposes.</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />
        </>
    )
}
SalesOrderFulfilledContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}
