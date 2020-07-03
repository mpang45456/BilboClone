import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Input, Spin, Descriptions, Button, Row } from 'antd';
import { CloseCircleOutlined, EditOutlined, CheckCircleOutlined, CheckCircleTwoTone } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage } from '../context/AuthContext';
import CONFIG from '../config';
import { BilboDescriptions, BilboPageHeader, BilboDivider } from './UtilComponents';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export default function SupplierViewPage(props) {
    const history = useHistory();
    const [isLoadingSupplierDetails, setIsLoadingSupplierDetails] = useState(true);
    const [supplier, setSupplier] = useState({});

    useEffect(() => {
        bax.get(`/api/v1/supplier/${props.match.params.supplierID}`)
            .then(res => {
                if (res.status === 200) {
                    setSupplier(res.data);
                    setIsLoadingSupplierDetails(false);
                }
            }).catch(err => {
                setIsLoadingSupplierDetails(false);
                redirectToErrorPage(err, history);
            })
    }, [props.location])

    // TODO: Refactor and make more general
    const updateSupplierName = (newName) => {
        bax.patch(`/api/v1/supplier/${props.match.params.supplierID}`, {'name': newName})
            .then(res => {
                bax.get(`/api/v1/supplier/${props.match.params.supplierID}`)
                    .then(res => {
                        setSupplier(res.data);
                    })
            })
    }
    
    // TODO: Consider adding show more button later
    const title = (
        <div>
            <BilboPageHeader 
                title='Supplier Details'
                onBack={() => history.push(CONFIG.SUPPLIER_URL)}
            />
            <BilboDivider />
        </div>
    )
    return (
        <div>
            <Spin spinning={isLoadingSupplierDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Supplier Name" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.name} update={updateSupplierName}/>
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>
        </div>
    );
}

/**
 * React Component to display a value, while
 * giving the user to option to click on edit
 * to begin editing details. 
 * 
 * After editing, the user can then cancel or 
 * save the changes made. What happens when the 
 * changes are saved is entirely dependent on the
 * `update` function passed through the props. 
 * 
 * In the case of `SupplierViewPage`, this triggers
 * an API PATCH method call to update the fields
 * of the Supplier.
 * 
 */
function EditableItem(props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editItemValue, setEditItemValue] = useState(props.value);

    // For `Cancel`/`Save` Icon Button when Editing
    // `transformColor` is the color of the icon upon mouse hover
    const StyledIconButton = styled(Button)`
        background: none;
        border: none; 
        box-shadow: none;

        &:hover {
            transform: scale(1.2);
            background: none;
            color: ${props => props.transformcolor}
        }
    `

    // React Component to Display While Editing
    const isEditingItem = (
        <div style={{display: 'inline'}}>
            <Input defaultValue={props.value}
                   onChange={e => setEditItemValue(e.target.value)} 
                   style={{width: '50%'}}
                   />
            <StyledIconButton onClick={() => {
                        setEditItemValue(props.value);
                        setIsEditing(false);
                    }}
                    transformcolor='#c93623'
                    icon={<CloseCircleOutlined />}
            >
            </StyledIconButton>
            <StyledIconButton onClick={() => {
                        props.update(editItemValue);
                        setIsEditing(false)
                    }}
                    transformcolor='#52c41a'
                    icon={<CheckCircleOutlined />}
            >
            </StyledIconButton>
        </div>
    )

    // React Component to Display While Viewing
    const notIsEditingItem = (
        <Row>
            <span style={{width: '50%'}}>
                {props.value}
            </span>
            <Button onClick={() => { setIsEditing(true); }}
                    icon={<EditOutlined />} 
                    style={{background: 'none', border: 'none', boxShadow: 'none'}}>
                Edit
            </Button>
        </Row>
    )

    return (
        <div>
            {
                isEditing 
                ? isEditingItem
                : notIsEditingItem
            }
        </div>
    )
}
EditableItem.propTypes = {
    // The value to be displayed
    value: PropTypes.string.isRequired,
    // Function to call when value change is confirmed (`save` is invoked)
    update: PropTypes.func.isRequired
}