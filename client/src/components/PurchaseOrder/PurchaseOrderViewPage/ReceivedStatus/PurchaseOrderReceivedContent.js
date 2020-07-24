import React from 'react';
import { BilboDividerWithText,
         BilboDivider } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import { PO_STATES } from '../../../../../../server/data/databaseEnum';
import CollapsiblePurchaseOrderDataDisplay from '../CollapsiblePurchaseOrderDataDisplay';
import ConfirmAndProceedButton from '../ConfirmAndProceedButton';

/**
 * React Component to render content for Purchase Orders
 * that have `PO_STATES.RECEIVED` status.
 */
export default function PurchaseOrderReceivedContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Purchase Order package has been received by the warehouse team. Purchase Order is currently pending payment. </p>
            <CollapsiblePurchaseOrderDataDisplay 
                purchaseOrderMetaData={props.purchaseOrderMetaData} 
                purchaseOrderStateData={props.purchaseOrderStateData} 
            />
            
            <BilboDivider />
            <ConfirmAndProceedButton nextState={PO_STATES.FULFILLED}
                                     purchaseOrderMetaData={props.purchaseOrderMetaData}
                                     purchaseOrderStateData={props.purchaseOrderStateData}
            />
        </>
    )
}
PurchaseOrderReceivedContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}