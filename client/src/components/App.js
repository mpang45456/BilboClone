import React from 'react';
import { LoginPage } from './LoginPage';
import AppScaffold from './AppScaffold/AppScaffold';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { bax, AuthContext } from '../context/AuthContext';
import { BilboLoadingSpinner } from './UtilComponents';

import ThemeWrapper from './Theme';
import "../styles/styles.less";

import { getPermissionsList } from '../context/AuthContext';
/**
 * Root React Component Class for Bilbo App
 * 
 * Note: The Router is defined in this class, and 
 * has 2 types of routes at the top-level: <Route />
 * to `/login` and <PrivateRoute /> to `AppScaffold`,
 * which in turns houses all the other routes. Hence,
 * <PrivateRoute /> serves as a gatekeeper that 
 * prevents unauthenticated users from accessing 
 * protected locations. 
 */
export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isAuthenticated: false,  // Boolean to check whether user is authenticated
            permissionsList: []
        }
        this.setIsAuthenticated = this.setIsAuthenticated.bind(this);
        this.setPermissionsList = this.setPermissionsList.bind(this);
    }

    setIsAuthenticated(isAuthenticated) {
        this.setState({ isAuthenticated });
    }

    setPermissionsList(permissionsList) {
        this.setState({ permissionsList});
    }

    render() {
        return (
            <ThemeWrapper>
                <AuthContext.Provider value={{ isAuthenticated: this.state.isAuthenticated, 
                                                setIsAuthenticated: this.setIsAuthenticated,
                                                permissionsList: this.state.permissionsList,
                                                setPermissionsList: this.setPermissionsList }}>
                    <Router>
                        <Switch>
                            <Route
                                exact path='/login'
                                render={(props) => (
                                    <LoginPage {...props} />
                                )}
                            />
                            <PrivateRoute path='/' component={AppScaffold} />
                        </Switch>
                    </Router>
                </AuthContext.Provider>
            </ThemeWrapper>
        );
    }
}