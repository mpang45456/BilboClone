import React, { useState, useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Redirect } from 'react-router-dom';
import { useAuth, bax } from '../context/AuthContext';
import { getPermissionsList } from '../context/AuthContext';


// Horizontally centers a title h1 element on the screen
const Title = styled.h1`
    font-size: 6em;
    text-align: center;
    color: ${props => props.theme.colors.deepRed };
    position: absolute;
    top: 30%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
`;

// Positions wrapped elements in the center of the screen
const Wrapper = styled.div`
    padding: 2em;
    width: 30%;
    background: ${props => props.theme.colors.marble};
    position: absolute;
    left: 50%;
    top: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);

    min-width: 300px;
    max-width: 450px;
`;

// Simple footer for the Login Page
const Footer = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 0.5em;
    background-color: ${props => props.theme.colors.deepRed};
    color: ${props => props.theme.colors.marble};
    text-align: right;
`

/**
 * React Component for the LoginPage
 * 
 * @param location :specifies URL path (relative to baseURL)
 */
export function LoginPage({ location }) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validateStatus, setValidateStatus] = useState(undefined);
    const [helpMessage, setHelpMessage] = useState(undefined);
    const { isAuthenticated, setIsAuthenticated, setPermissionsList } = useAuth();

    /*
    Effect is applied everytime the URL's `location`
    changes. This is necessary whenever a redirect to
    `/login` is triggered to obtain a fresh value for
    `isAuthenticated`. A redirect to `/login` can be 
    triggered for a variety of reasons: 
    - Browser is refreshed (`isAuthenticated` is always
      initialised as `false`)
    - Browser cookies are cleared and an API call returns
      401 status code (`redirectToErrorPage` function
      will redirect to `/login`)
    - User intentionally navigates to `/login`
    */
    useEffect(() => {
        bax.post('/api/v1/auth/token')
            .then((res) => {
                setPermissionsList(getPermissionsList());
                setIsAuthenticated(true);
            }).catch(err => {
                setIsAuthenticated(false);
            })
    }, [location])

    // Send User-entered Credentials to /auth/login API
    let tryLogin = () => {
        setIsLoading(true);
        bax.post('/api/v1/auth/login',
                   { username: username, 
                     password: password })
            .then((res) => {
                setPermissionsList(getPermissionsList());
                setIsAuthenticated(true);
                setValidateStatus('success');
            }).catch((err => {
                setIsLoading(false);
                setValidateStatus('error');
                setHelpMessage('Incorrect credentials. Please try again!')
            }))
    }

    // Redirect back to original location after authentication.
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
        <div>
            <Title>
                Welcome
            </Title>
            
            <Wrapper>
                <Form onFinish={tryLogin}>
                    <Form.Item name='username'
                            validateStatus={validateStatus}
                            help={helpMessage}
                            rules={[{ required: true, message: 'Please input your Username!' }]}>
                        <Input prefix={<UserOutlined className="site-form-item-icon" />} 
                            placeholder="Username"
                            autoFocus
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
                                block
                                htmlType="submit" 
                                className="login-form-button"
                                loading={isLoading}>
                        Log in
                        </Button>
                    </Form.Item>
                </Form>
            </Wrapper>

            <Footer>
                Bilbo
            </Footer>
        </div>
    )
}
LoginPage.propTypes = {
    location: PropTypes.object.isRequired
}
