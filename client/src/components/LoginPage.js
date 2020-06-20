import React, { useState } from 'react';
import { EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined } from '@ant-design/icons';
import { Input, Space, Button } from 'antd';
import axios from 'axios';

export default function LoginPage(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    let tryLogin = () => {
        setIsLoading(true);

        // TODO: Factor out the variables
        axios.post('http://localhost:3000/auth/login',
                   { username: 'admin', 
                     password: '123'},
                   { withCredentials: true })
            .then((res) => {
                console.log(res);
            }).catch((err => {
                console.log(err);
            }))
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
        </div>
    )
}

