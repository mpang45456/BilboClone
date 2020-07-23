import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrderFulfilledContent(props) {
    return (
        <>
            Placeholder for Fulfilled Content
        </>
    )
}
PurchaseOrderFulfilledContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}