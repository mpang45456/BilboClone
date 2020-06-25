import React from 'react';
import { LoginPage } from './LoginPage';
import AppScaffold from './AppScaffold/AppScaffold';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { bax, AuthContext } from '../context/AuthContext';

import ThemeWrapper from './Theme';
import "../styles/styles.less";

import { getPermissionsList } from '../context/AuthContext';
/**
 * Root React Component Class for Bilbo App
 */
export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: true,       // For async call to check initial authentication
            isAuthenticated: false,  // Boolean to check whether user is authenticated
            permissionsList: []
        }
        this.setIsAuthenticated = this.setIsAuthenticated.bind(this);
        this.setIsFetching = this.setIsFetching.bind(this);
        this.setPermissionsList = this.setPermissionsList.bind(this);
    }

    /**
     * Makes an async call to check if the user
     * had previously logged in. For example, the user did
     * not log out, and reaccess the page. Or, the user hits 
     * the refresh button.
     * 
     * This is done by making a call to the /auth/token
     * endpoint. If the refresh token is valid, the response
     * status code will be 200, and `isAuthenticated` can be
     * set to `true`. Otherwise, the tokens are no longer
     * valid and `isAuthenticated` is set to false.
     * 
     * The Routes in the Router determine whether LoginPage
     * or the app's different authenticated views are rendered
     * depending on the value of `isAuthenticated`.
     */
    componentDidMount() {
        bax.post('/api/v1/auth/token', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                this.setPermissionsList(getPermissionsList());
                this.setIsAuthenticated(true);
            }
        }).catch(err => {
            this.setPermissionsList([]);
            this.setIsAuthenticated(false);
        }).then(() => {
            this.setIsFetching(false);
        })
    }

    setIsAuthenticated(isAuthenticated) {
        this.setState({ isAuthenticated });
    }

    setIsFetching(isFetching) {
        this.setState({ isFetching });
    }

    setPermissionsList(permissionsList) {
        this.setState({ permissionsList});
    }

    render() {
        if (this.state.isFetching) {
            // Async call made at `componentDidMount` to check
            // if user is already authenticated. Loading animation
            // is displayed before async call returns.
            // TODO: Update this
            return <h1>THIS IS THE FETCHING ANIMATION</h1>
        } else {
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
}