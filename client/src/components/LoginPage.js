import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import { Redirect } from 'react-router-dom';
import { useAuth, bax } from '../context/AuthContext';

import styled from 'styled-components';
const StyledButton = styled(Button)`
    color: ${props => props.theme.colors.powderPink };
    backgroundColor: ${props => props.theme.colors.powderPink };
    font-size: 1em;
    padding: 0.25em 1em;
    border: 2px solid palevioletred;
    border-radius: 3px;
    display: block;

    &.ant-btn {
        background: ${props => props.theme.colors.powderPink };
    }
`;

const Title = styled.h1`
    font-size: 6em;
    text-align: center;
    color: ${props => props.theme.colors.deepRed };
    position: absolute;
    top: 20%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);

    margin-bottom: 20px;

`;

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

    ${'' /* .ant-btn-primary {
        border: 2px solid ${props => props.theme.colors.powderPink };
        background: ${props => props.theme.colors.powderPink};
        color: ${props => props.theme.colors.deepRed };
    } */}
`;

// const Link = ({ className, children, onClick }) => (
//     <div>
//         <h1 onClick={onClick}>This is the h1</h1>
//         <a className={className}>
//         {children}
//         </a>
//     </div>

//   );
  
// const StyledLink = styled(Link)`
//     color: palevioletred;
//     font-weight: bold;
// `;

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
                <StyledButton type="primary" 
                        block
                        htmlType="submit" 
                        className="login-form-button"
                        loading={isLoading}>
                Log in
                </StyledButton>
            </Form.Item>

        </Form>

        </Wrapper>

        </div>
    )
}
