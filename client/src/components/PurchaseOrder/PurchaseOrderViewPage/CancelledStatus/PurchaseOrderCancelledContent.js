import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrderCancelledContent(props) {
    return (
        <>
            Placeholder for Cancelled Content
        </>
    )
}
PurchaseOrderCancelledContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}