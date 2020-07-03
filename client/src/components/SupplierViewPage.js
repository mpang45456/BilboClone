import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Input, Spin, Descriptions, Button, Row } from 'antd';
import { CloseCircleOutlined, EditOutlined, CheckCircleOutlined, CheckCircleTwoTone } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../context/AuthContext';
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

    // General function to make API PATCH call when a field is edited and saved
    // Returns a promise (child component is supposed to implement `catch` handler)
    const updateField = (fieldName, newFieldValue) => {
        let patchBody = {};
        patchBody[fieldName] = newFieldValue;
        console.log(patchBody)
        return bax.patch(`/api/v1/supplier/${props.match.params.supplierID}`, patchBody)
                  .then(res => {
                        return bax.get(`/api/v1/supplier/${props.match.params.supplierID}`);
                  }).then(res => {
                    setSupplier(res.data);
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
                        <EditableItem value={supplier.name} 
                                      update={(newName) => updateField('name', newName)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.address} 
                                      update={(newAddress) => updateField('address', newAddress)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Telephone" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.telephone} 
                                      update={(newTelephone) => updateField('telephone', newTelephone)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Fax" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.fax} 
                                      update={(newFax) => updateField('fax', newFax)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      isTextArea={true}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
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
 */
function EditableItem(props) {
    const { permissionsList } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editItemValue, setEditItemValue] = useState(props.value);

    const onSave = () => {
        props.update(editItemValue)
             .then(res => setIsEditing(false))
             .catch(err => redirectToErrorPage(err)) // TODO: Update with proper UI error handling (wrt <Input />)
    }
    
    const textAreaAutoSizeConfig = { minRows: 3, maxRows: 10 };

    // React Component to Display While Editing
    const isEditingItem = (
        <div style={{display: 'inline'}}>
            {
                props.isTextArea
                ? <Input.TextArea defaultValue={props.value}
                                  onChange={e => setEditItemValue(e.target.value)} 
                                  style={{width: '70%'}}
                                  autoSize={textAreaAutoSizeConfig}
                  />
                : <Input defaultValue={props.value}
                   onChange={e => setEditItemValue(e.target.value)} 
                   style={{width: '70%'}}
                  />
            }
            <EditableItemStyledIconButton onClick={() => {
                        setEditItemValue(props.value);
                        setIsEditing(false);
                    }}
                    transformcolor='#c93623'
                    icon={<CloseCircleOutlined />}
            >
            </EditableItemStyledIconButton>
            <EditableItemStyledIconButton onClick={onSave}
                    transformcolor='#52c41a'
                    icon={<CheckCircleOutlined />}
            >
            </EditableItemStyledIconButton>
        </div>
    )

    // React Component to Display While Viewing
    const notIsEditingItem = (
        <Row>
            {
                props.isTextArea
                ? <Input.TextArea value={props.value}
                                  style={{width: '70%'}}
                                  readOnly
                                  autoSize={textAreaAutoSizeConfig}
                  />
                : <span style={{width: '70%'}}>
                      {props.value}
                  </span>
            }
            <Button onClick={() => { setIsEditing(true); }}
                    icon={<EditOutlined />} 
                    style={{background: 'none', border: 'none', boxShadow: 'none'}}
                    disabled={!permissionsList.includes(props.requiredPerm)}
                >
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
    // Whether an <Input /> or <Input.TextArea /> is displayed
    isTextArea: PropTypes.bool.isRequired,
    // The value to be displayed
    value: PropTypes.string,
    // Function to call when value change is confirmed (`save` is invoked)
    update: PropTypes.func.isRequired,
    // Required Permission to click on Edit button
    requiredPerm: PropTypes.string.isRequired,
}
EditableItem.defaultProps = {
    isTextArea: false
}

// For `Cancel`/`Save` Icon Button when Editing
// `transformColor` is the color of the icon upon mouse hover
const EditableItemStyledIconButton = styled(Button)`
    background: none;
    border: none; 
    box-shadow: none;

    &:hover {
        transform: scale(1.2);
        background: none;
        color: ${props => props.transformcolor}
    }
`
EditableItemStyledIconButton.propTypes = {
    transformcolor: PropTypes.string.isRequired
}