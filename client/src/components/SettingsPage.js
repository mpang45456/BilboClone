import React from 'react';
import { Route } from 'react-router-dom';

export default function SettingsPage(props) {
    return (
        <div>
            <h1>Settings Page</h1>
            <Route path={`${props.match.path}/:settingsID`}
                   component={SettingComponent} />
        </div>
    );
}

// FIXME: This is just for testing nested routes
const SettingComponent = function(props) {
    return (
        <h1>
            {props.match.url}
        </h1>
    )
}