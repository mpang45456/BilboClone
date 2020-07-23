import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrderQuotationContent(props) {
    return (
        <>
            Placeholder for Quotation Content
        </>
    )
}
PurchaseOrderQuotationContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}