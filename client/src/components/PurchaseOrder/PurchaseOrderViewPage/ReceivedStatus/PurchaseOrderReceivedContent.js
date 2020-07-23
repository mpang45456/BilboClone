import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrderReceivedContent(props) {
    return (
        <>
            Placeholder for Received Content
        </>
    )
}
PurchaseOrderReceivedContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}