import React from 'react';
import { Route } from 'react-router-dom';

export default function PurchasePage(props) {
    return (
        <div>
            <h1>Purchase Page</h1>
            <Route path={`${props.match.path}/:purchaseID`}
                   component={PurchaseComponent} />
        </div>
    );
}

// FIXME: This is just for testing nested routes
const PurchaseComponent = function(props) {
    return (
        <h1>
            {props.match.url}
        </h1>
    )
}