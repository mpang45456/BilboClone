import React, { useState } from 'react';
import { EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined } from '@ant-design/icons';
import { Input, Space, Button } from 'antd';
import axios from 'axios';

const bax = axios.create();
bax.defaults.withCredentials = true; // FIXME: Required for react webpack-dev-server
bax.defaults.baseURL = 'http://localhost:3000';
bax.interceptors.response.use(
    function(res) {
        // Status Code: 2xx
        console.log("using interceptor: success"); //FIXME: DEBUG
        return res;

    }, function(err) {
        const originalReq = err.config;
        console.log('using interceptor: error'); //FIXME: DEBUG
        // Status Code falls outside 2xx

        return new Promise((resolve, reject) => {
            if ((err.response.status === 401) || (err.response.status === 403)) {
                // Not baxios (to avoid the token refresh call from going
                // through the interceptor)
                // FIXME: Must be able to change and specify baseURL
                let res = axios.post('http://localhost:3000/auth/token', { withCredentials: true})
                    .then((res) => {
                        return axios(originalReq);
                    }).then((res) => {
                        resolve(res);
                    }).catch((err) => {
                        reject(err);
                    })
                // 
                // resolve(res);
                
            } else {
                reject(err); // FIXME: Promise.reject?
            }
        });
    }
)

export default function LoginPage(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    let tryLogin = () => {
        setIsLoading(true);

        // TODO: Factor out the variables
        bax.post('/auth/login',
                   { username: username, 
                     password: password})
            .then((res) => {
                console.log("SUCCESS: :", res.status);
            }).catch((err => {
                console.log("ERROR: ", err.response.status)
            }))
    }

    let tryGetProtectedSource = () => {
        bax.get('/auth/user')
            .then((res) => {
                console.log(res.text);
            }).catch(err => {
                console.log("err: " , err);
            })
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