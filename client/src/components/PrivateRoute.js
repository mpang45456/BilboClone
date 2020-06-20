import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Helper class to establish Routes that are accessible
 * only if the user has successfully authenticated.
 * 
 * Any Component can be added here.
 */
export default function PrivateRoute({ component: Component, ...rest }) {
    const { isAuthenticated } = useAuth();

    return (
        <Route {...rest} render={ (props) => (
            isAuthenticated ? (<Component {...props} />)
                            : (<Redirect to={{ pathname: '/login', 
                                               state: { referer: props.location } }}/>)
        )}
        />
    )
}
