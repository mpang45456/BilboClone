import React from 'react';
import { BilboDividerWithText,
         BilboDivider } from '../../../UtilComponents';
import PropTypes from 'prop-types';
import CollapsiblePurchaseOrderDataDisplay from '../CollapsiblePurchaseOrderDataDisplay';
import { PO_STATES } from '../../../../../../server/data/databaseEnum';
import ConfirmAndProceedButton from '../ConfirmAndProceedButton';

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
            
            {/* TODO: Remove this after debugging. This is meant for warehouse user only */}
            <BilboDivider />
            <ConfirmAndProceedButton nextState={PO_STATES.RECEIVED}
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