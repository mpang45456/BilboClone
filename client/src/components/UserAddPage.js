import React, { useState, useEffect } from 'react';
import { Spin, Input, Button, Row, Menu, Modal, Form, Select } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS } from '../context/AuthContext';
import { BilboPageHeader, BilboDivider } from './UtilComponents';
import CONFIG from '../config';

/**
 * Component to add user to Bilbo. 
 * 
 * Note the difference in approach here and in
 * UserEditPage (forms are much easier to handle, 
 * since you do not need to explicitly create and 
 * set the state. This is because the `onFinish`
 * handler provides all the values for you. However,
 * state is still used for `username` because custom
 * validation is performed on the username field. 
 * 
 * Note: only 3 fields are validated in the user add page:
 * 1. `username`: must be globally unique
 * 2. `reportsTo`: must be chosen from the set of provided 
 *                 values in the dropdown list (populated
 *                 through a call to the /users endpoint)
 * 3. `permissions`: must be chosen from the set of provided
 *                   values in the dropdown list (populated
 *                   through the client-side PERMS variable)
 */
export default function UserAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.USER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
    const [isLoading, setIsLoading] = useState(true); // For initial API call (to retrieve all user details (to populate list of usernames))
    const [isSubmitting, setIsSubmitting] = useState(false); // For POST API call (when clicking on submit button)
    const [allUsers, setAllUsers] = useState([]); // arrays of usernames
    const [username, setUsername] = useState({}); // { value, validateStatus, errorMsg} (the last 2 fields are for validation purposes)
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

    // Perform validation on username and store username in state
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

    // Handler when submit button is clicked on
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

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.USER_URL);
    }
    
    // Layout of <Form> 
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
UserAddPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}
