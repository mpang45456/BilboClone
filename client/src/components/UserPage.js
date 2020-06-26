import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { List, PageHeader, Dropdown, Button, Menu, Skeleton } from 'antd';
import { EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import { bax, useAuth, PERMS } from '../context/AuthContext';
import { BilboPageHeader, BilboNavLink, ShowMoreButton } from './UtilComponents';
import CONFIG from '../config';

export default function UserPage(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState([]);
    const { permissionsList } = useAuth();


    // TODO: Add user authorization (USER_READ)
    // TODO: Add user authorization (USER_WRITE for add user button)
    useEffect(() => {
        bax.get('/api/v1/user', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                setUserData(res.data);
                setIsLoading(false);
            }
        }).catch(err => {
            // TODO: Add Error Component
            console.log('error');
        })
    }, []) // Will only run when component first mounts


    // TODO: Abstract out separate components
    return (
        <div>
            <BilboPageHeader 
                title='All Users'
                extra={[
                    <AllUsersShowMoreButton 
                        key='allUsersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.USER_WRITE)}
                    />
                ]}
            />

            <List
                loading={isLoading}
                itemLayout='horizontal'
                dataSource={userData}
                renderItem={ user => {
                    let actions = [<BilboNavLink to={`${CONFIG.USER_URL}/${user.username}`}>view</BilboNavLink>];
                    if (permissionsList.includes(PERMS.USER_WRITE)) {
                        actions.push(<BilboNavLink to={CONFIG.EDIT_USER_URL}>edit</BilboNavLink>)
                    }

                    return (
                        <List.Item
                            actions={actions}
                            >
                            <Skeleton
                                title={false}
                                loading={user.loading}
                                active>
                                <List.Item.Meta
                                    title={user.name}
                                    description={user.position}>
                                </List.Item.Meta>
                            </Skeleton>
                        </List.Item>
                    )
                }}>

            </List>
        </div>
    );
}

// Customise ShowMoreButton for UsersPage
function AllUsersShowMoreButton(props) {
    const menu = (
        <Menu>
            <Menu.Item 
                key='addUserItem'
                icon={<PlusOutlined/>}>
                Add a User
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='allUsersShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllUsersShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}
AllUsersShowMoreButton.defaultProps = {
    disabled: false
}