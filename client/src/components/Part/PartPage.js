import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, BilboPageHeader, BilboDivider, BilboSearchTable, BilboNavLink } from '../UtilComponents';
import { Menu, Table, Input, Button, Row, Space, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import queryString from 'query-string';


export default function PartPage(props) {
    const { permissionsList } = useAuth();
    return (
        <>
            <BilboPageHeader 
                title='All Parts'
                subTitle='List of All Parts'
                extra={[
                    <AllPartsShowMoreButton 
                        key='allPartsShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.PART_WRITE)}
                    />
                ]}
            />

            <BilboDivider />
        </>
    )
}

function AllPartsShowMoreButton(props) {
    const history = useHistory();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addPartItem') {
            console.log("TO BE IMPLEMENTED");
            // history.push(`${CONFIG.PART_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='addPartItem'
                icon={<PlusOutlined />}>
                Add a Part
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allPartsShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllPartsShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}