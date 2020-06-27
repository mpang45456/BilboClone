import React, { useState, useEffect } from 'react';
import { Spin, Descriptions, Input, Select, Button, Row } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import { bax, useAuth, PERMS } from '../context/AuthContext';
import { BilboPageHeader, BilboDivider, BilboDescriptions } from './UtilComponents';

// TODO: Update documentation
export default function UserEditPage(props) {
    const { permissionsList } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true); // For initial API call (to retrieve user details)
    const [isUpdating, setIsUpdating] = useState(false); // For update API call (when clicking on update button)
    const [user, setUser] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const history = useHistory();

    // TODO: Shift this upwards
    if (!permissionsList.includes(PERMS.USER_WRITE)) {
        return <Redirect to='/error403'/>
    }

    useEffect(() => {
        (async function getUserDetails() {
            try {
                let res = await bax.get(`/api/v1/user/${props.match.params.username}`);
                setUser(res.data);
                
                let allUsersRes = await bax.get('/api/v1/user');
                // Only usernames are kept (all other fields are removed)
                let allUsersData = allUsersRes.data.map(user => {
                    return { username: user.username }
                })
                allUsersData.push({username: 'none' });
                setAllUsers(allUsersData);
                
                setIsLoading(false);
            } catch(err) {
                if (err.response.status === 403) {
                    // If unauthorized, redirect to error page
                    history.push('/error403');
                } else {
                    // If something goes wrong server-side
                    // redirect to error page
                    history.push('/error500');
                }
            }
        })();
    }, [props.location])

    const updateUsername = (val) => {
        let newUser = Object.assign({}, user);
        newUser.username = val;
        setUser(newUser);
    }

    const updateName = (val) => {
        let newUser = Object.assign({}, user);
        newUser.name = val;
        setUser(newUser);
    }

    const updatePosition = (val) => {
        let newUser = Object.assign({}, user);
        newUser.position = val;
        setUser(newUser);
    }

    const updateReportsTo = (val) => {
        let newUser = Object.assign({}, user);
        newUser.reportsTo = val;
        setUser(newUser);
    }

    const updatePassword = (val) => {
        let newUser = Object.assign({}, user);
        newUser.password = val;
        setUser(newUser);
    }

    const postAndUpdateUserDetails = (e) => {
        setIsUpdating(true);
        bax.patch(`api/v1/user/${user.username}`, user)
            .then(res => {
                console.log('success!');
                console.log(res);
            }).catch(err => {
                console.log('error');
                console.log(err)
            })
    }
    
    const title = (
        <div>
            <BilboPageHeader 
                title='User Account Details'
                onBack={() => history.push('/users')}/>
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
                               onChange={(e) => updateUsername(e.target.value)}
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
                <Button>
                    Cancel
                </Button>

                <Button type='primary'
                        loading={isUpdating}
                        onClick={postAndUpdateUserDetails}>
                    Update
                </Button>
            </Row>
        </div>
    )
}