import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrdersTabContent(props) {
    return (
        <>
            <h1>To Be Implemented: {props.supplierID}</h1>
        </>
    )
}
PurchaseOrdersTabContent.propTypes = {
    supplierID: PropTypes.string.isRequired,
}

