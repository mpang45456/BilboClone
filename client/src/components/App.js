import React, { useState } from 'react';
import { Button } from 'antd';
import { bax, LoginPage } from './LoginPage';
import HomePage from './HomePage';
// import "antd/dist/antd.css"; //FIXME: Is this necessary?
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { AuthContext } from '../context/AuthContext';

// FIXME: DEBUG
import { Home, Admin } from './TestPages';

export default function App(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    checkInitialAuthentication(setIsAuthenticated);
    console.log('not sure when')
    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            <Button>Helloworld</Button>
            <Router>
                <Switch>
                    <Route
                        exact path='/login'
                        render={(props) => (
                            <LoginPage {...props} setIsAuthenticated={setIsAuthenticated} />
                        )}
                    />
                    <PrivateRoute path='/' component={HomePage} />
                </Switch>
            </Router>
        </AuthContext.Provider>
    );
}

// If valid refresh token is still present in cookies, simply
// contact the /auth/token endpoint to refresh the access token.
// If successful, user is still authenticated (this enables persistent login
// session that is only cleared if the user clears the cookies)
// TODO: Remember to clear the cookies on logout
function checkInitialAuthentication(setIsAuthenticated) {
    console.log('before')
    bax.post('/auth/token', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                setIsAuthenticated(true);
            }
            console.log('after')
        }).catch(err => {
            setIsAuthenticated(false);
        })
}