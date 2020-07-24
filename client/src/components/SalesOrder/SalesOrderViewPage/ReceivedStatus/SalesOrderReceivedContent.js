import React from 'react';
import { BilboDividerWithText,
         BilboDivider } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';
import ConfirmAndProceedButton from '../ConfirmAndProceedButton';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.RECEIVED` status.
 */
export default function SalesOrderReceivedContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order has been received and is currently pending payment. Proceed to next status when payment has been received</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />
            
            <BilboDivider />
            <ConfirmAndProceedButton nextState={SO_STATES.FULFILLED}
                                     salesOrderMetaData={props.salesOrderMetaData}
                                     salesOrderStateData={props.salesOrderStateData}
            />
        </>
    )
}
SalesOrderReceivedContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}
