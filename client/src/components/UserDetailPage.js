import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Descriptions, Spin, Menu } from 'antd';
import { bax, useAuth, PERMS } from '../context/AuthContext';
import { PlusOutlined } from "@ant-design/icons";
import { BilboDescriptions, BilboNavLink, BilboPageHeader, BilboDivider, ShowMoreButton } from './UtilComponents';
import CONFIG from '../config';


// TODO: Add documentation
// TODO: Add edit button at the top right hand corner (ShowMoreButton)?
export default function UserDetailPage(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState({});
    const history = useHistory();
    const { permissionsList } = useAuth();
    
    //Effect is applied whenever the route changes
    //i.e. the `username` in /user/:username
    useEffect(() => {
        // IIFE to obtain `user`'s details and details of 
        // the user `user` reports to
        (async function getUserDetails() {
            try {
                let res = await bax.get(`/api/v1/user/${props.match.params.username}`);
                let userDetails = res.data;
                if (userDetails.reportsTo !== 'none') {
                    let reportsToRes = await bax.get(`/api/v1/user/${res.data.reportsTo}`);
                    userDetails.reportsToName = reportsToRes.data.name;
                }
                setUser(userDetails);
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

    const title = (
        <div>
            <BilboPageHeader 
                title='User Account Details'
                onBack={() => history.push('/users')}
                extra={[
                    <EditUserShowMoreButton 
                        key='editUserShowMoreButton'
                        username={props.match.params.username}
                        disabled={!permissionsList.includes(PERMS.USER_WRITE)}
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
                                   column={1} >
                    <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
                    <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="Position">{user.position}</Descriptions.Item>
                    <Descriptions.Item label="Reports To">
                        {
                            user.reportsTo === 'none'
                            ? '-'
                            : <BilboNavLink to={`${CONFIG.USER_URL}/${user.reportsTo}`}>
                                {user.reportsToName}
                            </BilboNavLink>
                        }
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>
        </div>
    )
}


// Customise ShowMoreButton for UserDetailPage
function EditUserShowMoreButton(props) {
    const menu = (
        <Menu>
            <Menu.Item 
                key='editUserDetails'
                icon={<PlusOutlined/>}>
                <Link to={`${CONFIG.USER_URL}/${props.username}/edit`}>
                    Edit User Details
                </Link>
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='editUserShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
EditUserShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired,
    username: PropTypes.string.isRequired
}
EditUserShowMoreButton.defaultProps = {
    disabled: false
}