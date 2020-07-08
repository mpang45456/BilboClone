import React, { useState, useEffect } from 'react';
import { Spin, Descriptions, Input, Select, Button, Row, Menu, Modal } from 'antd';
const { confirm } = Modal;
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import { BilboPageHeader, BilboDivider, BilboDescriptions, ShowMoreButton } from '../UtilComponents';
import CONFIG from '../../config';

/**
 * Component for editing user details.
 * 
 * Note that users are not allowed to update their
 * username (because the usernames are their ID)
 */
export default function UserEditPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.USER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
    const [isLoading, setIsLoading] = useState(true); // For initial API call (to retrieve user details)
    const [isUpdating, setIsUpdating] = useState(false); // For update API call (when clicking on update button)
    const [user, setUser] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const history = useHistory();

    // Effect is only applied when URL location changes
    useEffect(() => {
        (async function getUserDetails() {
            try {
                let res = await bax.get(`/api/v1/user/${props.match.params.username}`);
                setUser(res.data);
                
                // Used to populate the `reportsTo` dropdown
                let allUsersRes = await bax.get('/api/v1/user');
                // Only usernames are kept (all other fields are removed)
                let allUsersData = allUsersRes.data.map(user => {
                    return { username: user.username }
                })
                allUsersData.push({username: 'none' });
                setAllUsers(allUsersData);
                
                setIsLoading(false);
            } catch(err) {
                redirectToErrorPage(err, history);
            }
        })();
    }, [props.location])

    // Helper function to update a field in the user obj
    const updateField = (val, fieldName) => {
        let newUser = Object.assign({}, user);
        newUser[fieldName] = val;
        setUser(newUser);
    }
    const updateName = (val) => updateField(val, 'name');
    const updatePosition = (val) => updateField(val, 'position');
    const updateReportsTo = (val) => updateField(val, 'reportsTo');
    const updatePassword = (val) => updateField(val, 'password');

    const clickCancelButton = (e) => {
        history.push(CONFIG.USER_URL)
    }
    const clickUpdateButton = (e) => {
        setIsUpdating(true);
        bax.patch(`/api/v1/user/${user.username}`, user)
            .then(res => {
                setIsUpdating(false);
                history.push(CONFIG.USER_URL)
            }).catch(err => {
                setIsUpdating(false);
                redirectToErrorPage(err, history);
            })
    }
    
    const title = (
        <div>
            <BilboPageHeader 
                title='Edit User Account Details'
                onBack={() => history.push(CONFIG.USER_URL)}
                extra={[
                    <DeleteUserShowMoreButton 
                        key='deleteUserShowMoreButton'
                        username={props.match.params.username}
                    />
                ]}
            />
            <BilboDivider />
        </div>
    )

    return (
        <div>
            <Spin spinning={isLoading}>
                <BilboDescriptions title={title}
                                   bordered 
                                   size="small"
                                   column={1} >
                    <Descriptions.Item label="Username">
                        <Input value={user.username} 
                                disabled={true} />
                    </Descriptions.Item>

                    <Descriptions.Item label="Name">
                        <Input value={user.name} 
                               onChange={(e) => updateName(e.target.value)}
                               disabled={isUpdating} />
                    </Descriptions.Item>

                    <Descriptions.Item label="Position">
                        <Input value={user.position} 
                               onChange={(e) => updatePosition(e.target.value)}
                               disabled={isUpdating} />
                    </Descriptions.Item>

                    <Descriptions.Item label="Reports To">
                        <Select showSearch 
                                style={{width:'100%'}} 
                                value={user.reportsTo} 
                                onChange={updateReportsTo}
                                disabled={isUpdating} >
                            {allUsers.map(user => <Option value={user.username} key={user.username}>{user.username}</Option>)}
                        </Select>
                    </Descriptions.Item>
                </BilboDescriptions>
                
                <BilboDivider />

                <BilboDescriptions bordered
                                   size='small'
                                   column={1}>
                    <Descriptions.Item label="Reset Password">
                        <Input.Password placeholder='Reset Password Here'
                                        onChange={(e) => updatePassword(e.target.value)}
                                        disabled={isUpdating} />
                    </Descriptions.Item>
                </BilboDescriptions>
                <BilboDivider />
            </Spin>

            <Row justify='end'>
                <Button onClick={clickCancelButton}>
                    Cancel
                </Button>
                <Button type='primary'
                        loading={isUpdating}
                        onClick={clickUpdateButton}>
                    Update
                </Button>
            </Row>
        </div>
    )
}
UserEditPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}

// Customise ShowMoreButton for UserEditPage
function DeleteUserShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'deleteUser') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to delete this user?',
                onOk: () => {
                    bax.delete(`/api/v1/user/${props.username}`)
                        .then(res => {
                            if (res.status === 200) {
                                history.push(CONFIG.USER_URL);
                            }
                        }).catch(err => {
                            redirectToErrorPage(err, history);
                        })
                },
                okText: 'Confirm'
            })
        }
    }
    
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='deleteUser'
                icon={<DeleteOutlined/>}>
                Delete User
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='deleteUserShowMoreDropdown'
            menu={menu}
            disabled={false}
        />
    )
}
DeleteUserShowMoreButton.propTypes = {
    username: PropTypes.string.isRequired
}