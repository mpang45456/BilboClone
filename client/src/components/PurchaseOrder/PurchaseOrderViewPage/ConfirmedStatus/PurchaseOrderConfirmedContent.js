import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrderConfirmedContent(props) {
    return (
        <>
            Placeholder for Confirmed Content
        </>
    )
}
PurchaseOrderConfirmedContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}