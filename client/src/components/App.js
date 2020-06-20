import React from 'react';
import { LoginPage } from './LoginPage';
import HomePage from './HomePage';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { bax, AuthContext } from '../context/AuthContext';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: true,       // For async call to check initial authentication
            isAuthenticated: false  // Boolean to check whether user is authenticated
        }
        this.setIsAuthenticated = this.setIsAuthenticated.bind(this);
        this.setIsFetching = this.setIsFetching.bind(this);
    }

    componentDidMount() {
        bax.post('/auth/token', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                this.setIsAuthenticated(true);
            }
        }).catch(err => {
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

    render() {
        if (this.state.isFetching) {
            // TODO: Update this
            return <h1>THIS IS THE FETCHING ANIMATION</h1>
        } else {
            return (
                <AuthContext.Provider value={{ isAuthenticated: this.state.isAuthenticated }}>
                    <Router>
                        <Switch>
                            <Route
                                exact path='/login'
                                render={(props) => (
                                    <LoginPage {...props} setIsAuthenticated={this.setIsAuthenticated} />
                                )}
                            />
                            <PrivateRoute path='/' component={HomePage} />
                        </Switch>
                    </Router>
                </AuthContext.Provider>
            );
        }
    }
}


// export default function App(props) {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);

//     // useEffect(async () => {
//     //     await bax.post('/auth/token', { withCredentials: true})
//     //     .then(res => {
//     //         if (res.status === 200) {
//     //             setIsAuthenticated(true);
//     //         }
//     //         console.log('after')
//     //     }).catch(err => {
//     //         setIsAuthenticated(false);
//     //     })
//     // })



//     checkInitialAuthentication(setIsAuthenticated);
//     return (
//         <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
//             <Button>Helloworld</Button>
//             <Router>
//                 <Switch>
//                     <Route
//                         exact path='/login'
//                         render={(props) => (
//                             <LoginPage {...props} setIsAuthenticated={setIsAuthenticated} />
//                         )}
//                     />
//                     <PrivateRoute path='/' component={HomePage} />
//                 </Switch>
//             </Router>
//         </AuthContext.Provider>
//     );
// }

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

// function checkInitialAuthentication(setIsAuthenticated) {
//     console.log('before')
//     bax.post('/auth/token', { withCredentials: true})
//         .then(res => {
//             if (res.status === 200) {
//                 return true;
//             }
//             return false
//         }).catch(err => {
//             return false;
//         })
// }