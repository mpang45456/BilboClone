import React from 'react'

export default function SupplierViewPage(props) {
    return (
        <div>
            <h1>Supplier View Page</h1>
            <h2>{props.match.params.supplierID}</h2>
        </div>
    );
}