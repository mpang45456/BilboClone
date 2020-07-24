import React from 'react';
import { BilboDividerWithText,
         BilboDivider } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';
import ConfirmAndProceedButton from '../ConfirmAndProceedButton';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.IN_DELIVERY` status.
 */
export default function SalesOrderInDeliveryContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order's package is currently in-delivery. Proceed to the next status when you have received confirmation of delivery.</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />
            
            <BilboDivider />
            <ConfirmAndProceedButton nextState={SO_STATES.RECEIVED}
                                     salesOrderMetaData={props.salesOrderMetaData}
                                     salesOrderStateData={props.salesOrderStateData}
            />
        </>
    )
}
SalesOrderInDeliveryContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}
