import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import { Redirect } from 'react-router-dom';
import { useAuth, bax } from '../context/AuthContext';

/**
 * React Component for the LoginPage
 * 
 * @param location :specifies URL path (relative to baseURL)
 * @param setIsAuthenticated :sets the `isAuthenticated` variable
 *                            which determines where the user has
 *                            logged in and has access to Bilbo
 */
export function LoginPage({location, setIsAuthenticated}) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validateStatus, setValidateStatus] = useState(undefined);
    const [helpMessage, setHelpMessage] = useState(undefined);
    const { isAuthenticated } = useAuth();

    // Send User-entered Credentials to /auth/login API
    let tryLogin = () => {
        setIsLoading(true);
        bax.post('/auth/login',
                   { username: username, 
                     password: password})
            .then((res) => {
                setIsAuthenticated(true);
                setValidateStatus('success');
            }).catch((err => {
                // FIXME: Add UI response when credentials invalid
                setIsLoading(false);
                setValidateStatus('error');
                setHelpMessage('Incorrect credentials. Please try again!')
            }))
    }

    // Redirect back to original location after authentication
    // `props.location.state.referer` is set in `PrivateRoute`
    let referer = null;
    try {
        referer = location.state.referer || '/';
    } catch(err) {
        referer = '/'
    }
    if (isAuthenticated) {
        return <Redirect to={referer} />
    }

    return (
        <Form onFinish={tryLogin}>
            <Form.Item name='username'
                       validateStatus={validateStatus}
                       help={helpMessage}
                       rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input prefix={<UserOutlined className="site-form-item-icon" />} 
                       placeholder="Username"
                       onChange={e => {
                           setUsername(e.target.value);
                       }}
                />
            </Form.Item>
            <Form.Item
                name="password"
                validateStatus={validateStatus}
                help={helpMessage}
                rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input.Password
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                    onChange={e => {
                        setPassword(e.target.value);
                    }}
                />
            </Form.Item>
            <Form.Item>
                <Button type="primary" 
                        htmlType="submit" 
                        className="login-form-button"
                        loading={isLoading}>
                Log in
                </Button>
            </Form.Item>
        </Form>
    )
}
