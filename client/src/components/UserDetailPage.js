import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Descriptions, Spin } from 'antd';
import { bax } from '../context/AuthContext';
import { BilboDescriptions, BilboNavLink, BilboPageHeader } from './UtilComponents';
import CONFIG from '../config';


export default function UserDetailPage(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState({});
    const history = useHistory();
    //Effect is applied whenever the route changes
    //i.e. the `username` in /user/:username
    useEffect(() => {
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
                    history.push('/error403');
                } else {
                    // If something goes wrong server-side
                    // redirect to error page
                    history.push('/error500');
                }
            }
        })();
    }, [props.match.params.username])

    return (
        <div>
            <Spin spinning={isLoading}>
                <BilboDescriptions title={ <BilboPageHeader 
                                            title='User Account Details' /> }
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