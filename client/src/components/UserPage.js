import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { List, PageHeader, Dropdown, Button, Menu, Skeleton } from 'antd';
import { EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import { bax, useAuth, PERMS } from '../context/AuthContext';

export default function UserPage(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState([]);
    const { permissionsList } = useAuth();


    // TODO: Add user authorization (USER_READ)
    // TODO: Add user authorization (USER_WRITE for add user button)
    useEffect(() => {
        console.log('useeffect'); // FIXME: DEBUG
        bax.get('/api/v1/user', { withCredentials: true})
        .then(res => {
            if (res.status === 200) {
                setUserData(res.data);
                setIsLoading(false);
            }
        }).catch(err => {
            console.log('error');
        })
    }, []) // Will only run when component first mounts


    // TODO: Abstract out separate components
    return (
        <div>
            <PageHeader 
                title='All Users'
                extra={[
                    <AllUsersShowMoreButton key='allUsersShowMoreButton'/>
                ]}
                style={{
                    padding: 0
                }}
            />

            <List
                loading={isLoading}
                itemLayout='horizontal'
                dataSource={userData}
                renderItem={ user => {
                    return (
                        <List.Item
                            actions={
                                permissionsList.includes(PERMS.USER_WRITE) &&
                                [<a>edit</a>]
                            }
                            >
                            <Skeleton
                                title={false}
                                loading={user.loading}
                                active>
                                <List.Item.Meta
                                    title={user.name}
                                    description={user.position}>
                                </List.Item.Meta>
                                <div>Insert Content Here</div>
                            </Skeleton>
                        </List.Item>
                    )
                }}>

            </List>
        </div>
    );
}

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
            menu = {menu}
        />
    )
}



// TODO: Abstract this into UtilComponents later
function ShowMoreButton(props) {
    return (
        <Dropdown key={props.dropdownKey} 
                  overlay={props.menu}
                  trigger='click' >
            <Button style={{ border: 'none', 
                             backgroundColor: 'transparent',
                             boxShadow: 'none' }}>
                <EllipsisOutlined style={{
                    fontSize: 20
                }} />
            </Button>
        </Dropdown>
    );
}

ShowMoreButton.propTypes = {
    dropdownKey: PropTypes.string.isRequired,
    menu: PropTypes.element.isRequired
}