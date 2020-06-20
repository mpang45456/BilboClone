import React, { useState } from 'react';
import { EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined } from '@ant-design/icons';
import { Input, Space, Button } from 'antd';
import axios from 'axios';
import { Redirect, withRouter } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import P from 'pino';

export const bax = axios.create();
bax.defaults.withCredentials = true; // FIXME: Required for react webpack-dev-server
bax.defaults.baseURL = 'http://localhost:3000';
bax.interceptors.response.use(
    function(res) {
        // Status Code: 2xx
        return res;
    }, function(err) {
        const originalReq = err.config;

        if ((err.response.status === 401 || err.response.status === 403)) {
            if (originalReq.url === '/auth/token') {
                // Prevent loops
                // FIXME: React Router?
            } else {
                return bax.post('/auth/token', { withCredentials: true})
                            .then(res => {
                                if (res.status === 200) {
                                    return bax(originalReq);
                                }
                            })
            }
        }
        
        return Promise.reject(err);
    }
)

// TODO: explicitly destructure props?
export function LoginPage(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const setIsAuthenticated = props.setIsAuthenticated;
    const { isAuthenticated } = useAuth();

    let tryLogin = () => {
        setIsLoading(true);

        // TODO: Factor out the variables
        bax.post('/auth/login',
                   { username: username, 
                     password: password})
            .then((res) => {
                setIsAuthenticated(true);
                console.log("SUCCESS: :", res.status);
            }).catch((err => {
                // FIXME: Add UI response when credentials invalid
                console.log("ERROR: ", err.response.status)
            }))
    }

    let tryGetProtectedSource = () => {
        bax.get('/auth/user')
            .then((res) => {
                console.log('here')
                console.log(res);
            }).catch(err => {
                console.log('there')
                console.log("err: " , err);
            })
    }

    // Redirect back to original location after authentication
    // `props.location.state.referer` is set in `PrivateRoute`
    const referer = props.location.state.referer || '/';
    if (isAuthenticated) {
        return <Redirect to={referer} />
    }

    return (
        <div>
            <Input placeholder='Username' 
                   onChange={e => {
                       setUsername(e.target.value);
                   }}
                   onPressEnter={tryLogin}
                   />
            <Input.Password 
                placeholder='Password'
                onChange={e => {
                    setPassword(e.target.value);
                }}
                onPressEnter={tryLogin}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
            <Button type='primary' 
                    icon={<ArrowRightOutlined />}
                    onClick={tryLogin}
                    loading={isLoading}
            />
            <Button onClick={tryGetProtectedSource}>
                Try to get protected resource!
            </Button>
        </div>
    )
}





// axios.interceptors.response.use(response => {
//     return response;
// }, err => {
//     return new Promise((resolve, reject) => {
//         const originalReq = err.config;
//         if ( err.response.status === 401 && err.config && !err.config.__isRetryRequest )
//         {
//             originalReq._retry = true;

//             let res = fetch('http://localhost:8080/api/v1/auth/refresh', {
//                 method: 'POST',
//                 mode: 'cors',
//                 cache: 'no-cache',
//                 credentials: 'same-origin',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Device': 'device',
//                     'Token': localStorage.getItem("token")
//                 },
//                 redirect: 'follow',
//                 referrer: 'no-referrer',
//                 body: JSON.stringify({
//                     token: localStorage.getItem("token"),
//                     refresh_token: localStorage.getItem("refresh_token")
//                 }),
//             }).then(res => res.json()).then(res => {
//                 console.log(res);
//                 this.setSession({token: res.token, refresh_token: res.refresh});
//                 originalReq.headers['Token'] = res.token;
//                 originalReq.headers['Device'] = "device";


//                 return axios(originalReq);
//             });


//             resolve(res);
//         }


//         return Promise.reject(err);
//     });
// });