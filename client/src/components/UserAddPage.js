import React, { useState, useEffect } from 'react';
import { Spin, Descriptions, Input, Button, Row, Menu, Modal, Form, Select } from 'antd';
const { confirm } = Modal;
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS } from '../context/AuthContext';
import { BilboPageHeader, BilboDivider, BilboDescriptions, ShowMoreButton } from './UtilComponents';
import CONFIG from '../config';

// TODO: Add documentation
// Note the difference in approach here and in UserEditPage (forms are much
// easier to handle, since you do not need to explicitly set the state, the `onFinish`
// handler provides all the values for you. There is the exception of username, 
// where custom validation is used)
export default function UserEditPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.USER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
    const [isLoading, setIsLoading] = useState(true); // For initial API call (to retrieve all user details (to populate list of usernames))
    const [isSubmitting, setIsSubmitting] = useState(false); // For POST API call (when clicking on submit button)
    const [allUsers, setAllUsers] = useState([]);
    const history = useHistory();

    // Effect is only applied when URL location changes
    useEffect(() => {
        (async function getAllUserDetails() {
            try {
                // Used to get list of all usernames 
                // and populate `reportTo` dropdown
                let allUsersRes = await bax.get('/api/v1/user');
                // Only usernames are kept (all other fields are removed)
                let allUsersData = allUsersRes.data.map(user => {
                    return user.username;
                })
                allUsersData.push('none');
                setAllUsers(allUsersData);
                
                setIsLoading(false);
            } catch(err) {
                if (err.response.status === 403) {
                    // If unauthorized, redirect to error page
                    history.push(CONFIG.ERROR_403_URL);
                } else {
                    // If something goes wrong server-side
                    // redirect to error page
                    history.push(CONFIG.ERROR_500_URL);
                }
            }
        })();
    }, [props.location])

    const [username, setUsername] = useState({}); // TODO: Should be able to just initialise as {}

    const onUsernameChange = (e) => {
        setUsername({
            ...validateUsername(e.target.value),
            value: e.target.value
        })
    }

    const validateUsername = (u) => {
        if (allUsers.includes(u)) {
            return {
                validateStatus: 'error',
                errorMsg: 'Username is already taken'
            }
        } else {
            return {
                validateStatus: 'success',
                errorMsg: null
            }
        }
    }

    const tryCreateNewUser = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/user', values)
            .then(res => {
                history.push(CONFIG.USER_URL);
                setIsSubmitting(false);
            }).catch(err => {
                history.push(CONFIG.ERROR_500_URL);
                setIsSubmitting(false);
            })
    }

    const clickCancelButton = () => {
        history.push(CONFIG.USER_URL);
    }
    
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    return (
        <div>
            <BilboPageHeader 
                title='Add a New User'
                onBack={() => history.push(CONFIG.USER_URL)}
            />
            <BilboDivider />
            <Spin spinning={isLoading}>
                <Form name='createNewUserForm' 
                      labelAlign='left'
                      onFinish={tryCreateNewUser}
                      {...formItemLayout} >
                    <Form.Item name='name' 
                               label='Name'
                               rules={[{ required: true, message: 'Please input your name!' }]}
                               hasFeedback>
                        <Input />
                    </Form.Item>

                    <Form.Item name='position' 
                               label='Position'
                               rules={[{ required: true, message: 'Please input your position!' }]}
                               hasFeedback>
                        <Input />
                    </Form.Item>

                    <Form.Item name='reportsTo' 
                               label='Reports To'
                               rules={[{ required: true, message: "Please input your manager's name!" }]}
                               hasFeedback>
                        <Select showSearch >
                            {allUsers.map(user => <Option value={user} key={user}>{user}</Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name='username' 
                               label='Username' 
                               rules={[{ required: true, message: 'Please input your username!' }]}
                               hasFeedback
                               validateStatus={username.validateStatus}
                               help={username.errorMsg}>
                        <Input onChange={onUsernameChange}/>
                    </Form.Item>

                    <Form.Item name="password"
                               label="Password"
                               hasFeedback
                               rules={[{ required: true, message: 'Please input your password!' }]} >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item name="permissions"
                               label="Permissions"
                               hasFeedback
                               rules={[{ required: true, message: 'Please select at least 1 user permission!', type: 'array'}]}
                               >
                        <Select mode='multiple' >
                            {
                                Object.keys(PERMS).map(perm => {
                                    return (
                                        <Option value={perm} key={perm}>{perm}</Option>
                                    )
                                })
                            }
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Row justify='end'>
                            <Button onClick={clickCancelButton}>
                                Cancel
                            </Button>
                            <Button type='primary' htmlType='submit' loading={isSubmitting}>
                                Submit
                            </Button>
                        </Row>
                    </Form.Item>
                </Form>
            </Spin>

        </div>
    )
}
UserEditPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}
