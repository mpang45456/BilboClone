import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ component: Component, ...rest }) {
    const { isAuthenticated } = useAuth();

    console.log("Inside private route: ", isAuthenticated);
    return (
        <Route {...rest} render={ (props) => (
            isAuthenticated ? (<Component {...props} />)
                            : (<Redirect to={{ pathname: '/login', 
                                               state: { referer: props.location } }}/>)
        )}
        />
    )
}
