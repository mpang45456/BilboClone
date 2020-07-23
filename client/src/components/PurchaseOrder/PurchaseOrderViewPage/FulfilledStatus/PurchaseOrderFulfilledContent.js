import React from 'react';
import { BilboDividerWithText } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import CollapsiblePurchaseOrderDataDisplay from '../CollapsiblePurchaseOrderDataDisplay';

/**
 * React Component to render content for Purchase Orders
 * that have `PO_STATES.FULFILLED` status.
 */
export default function PurchaseOrderFulfilledContent(props) {
    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Purchase Order has been fulfilled. This record is just for archival purposes.</p>
            <CollapsiblePurchaseOrderDataDisplay 
                purchaseOrderMetaData={props.purchaseOrderMetaData} 
                purchaseOrderStateData={props.purchaseOrderStateData} 
            />
        </>
    )
}
PurchaseOrderFulfilledContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}