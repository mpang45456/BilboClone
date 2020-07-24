import React from 'react';
import { BilboDividerWithText } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import CollapsiblePurchaseOrderDataDisplay from '../CollapsiblePurchaseOrderDataDisplay';

/**
 * React Component to render content for Purchase Orders
 * that have `PO_STATES.CONFIRMED` status.
 */
export default function PurchaseOrderConfirmedContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Currently awaiting delivery of Purchase Order. Warehouse team will update status when package has arrived</p>
            <CollapsiblePurchaseOrderDataDisplay 
                purchaseOrderMetaData={props.purchaseOrderMetaData} 
                purchaseOrderStateData={props.purchaseOrderStateData} 
            />
        </>
    )
}
PurchaseOrderConfirmedContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}