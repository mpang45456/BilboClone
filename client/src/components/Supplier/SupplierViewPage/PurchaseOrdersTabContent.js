import React from 'react';
import PropTypes from 'prop-types';

export default function PurchaseOrdersTabContent(props) {
    return (
        <>
            <h1>To Be Implemented: {props.supplierid}</h1>
        </>
    )
}
PurchaseOrdersTabContent.propTypes = {
    supplierid: PropTypes.string.isRequired,
}

