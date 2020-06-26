import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { List, Menu, Skeleton, Divider } from 'antd';
import { PlusOutlined } from "@ant-design/icons";
import { bax, useAuth, PERMS } from '../context/AuthContext';
import { BilboPageHeader, BilboNavLink, ShowMoreButton, BilboDivider } from './UtilComponents';
import CONFIG from '../config';

/**
 * Component rendered at /user.
 * 
 * Has 2 main components:
 * 1. BilboPageHeader (contains header and
 *    show more button)
 * 2. UserList (renders the actual list of users)
 */
export default function UserPage(props) {
    const { permissionsList } = useAuth();
    return (
        <div>
            <BilboPageHeader 
                title='All Users'
                subTitle='View All Users'
                extra={[
                    <AllUsersShowMoreButton 
                        key='allUsersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.USER_WRITE)}
                    />
                ]}
            />
            <BilboDivider />
            <UserList />
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

/**
 * Component that renders list of users.
 * 
 * List only contains `name` and `position`.
 * For more information, will have to click on 'view'
 * link (assuming the user has USER_READ permissions)
 */
function UserList(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState([]);
    const { permissionsList } = useAuth();
    const history = useHistory();

    useEffect(() => {
        // Make API call to get list of users
        bax.get('/api/v1/user', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                setUserData(res.data);
                setIsLoading(false);
            }
        }).catch((err) => {
            if (err.response.status === 403) {
                // If unauthorized, redirect to error page
                history.push('/error403');
            } else {
                // If something goes wrong server-side
                // redirect to error page
                history.push('/error500');
            }
        })
    }, []) // Will only run when component first mounts
    // FIXME: Likely won't show updated user list when you make a change via the UI

    return (
        <List
            loading={isLoading}
            itemLayout='horizontal'
            dataSource={userData}
            renderItem={ user => {
                // With PERMS.USER_READ, can 'view'
                let actions = [<BilboNavLink to={`${CONFIG.USER_URL}/${user.username}`}>view</BilboNavLink>];

                // With PERMS.USER_WRITE, can 'edit'
                if (permissionsList.includes(PERMS.USER_WRITE)) {
                    actions.push(<BilboNavLink to={`${CONFIG.USER_URL}/${user.username}/edit`}>edit</BilboNavLink>)
                }

                return (
                    <List.Item actions={actions}>
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
    )
}