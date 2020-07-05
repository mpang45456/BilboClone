import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Spin, Descriptions, Tabs, Modal, Menu, message } from 'antd';
const { TabPane } = Tabs;
const { confirm } = Modal;
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboDescriptions, 
         BilboPageHeader, 
         BilboDivider, 
         EditableItem, 
         ShowMoreButton } from '../../UtilComponents';
import PartsTabContent from './PartsTabContent';
import PurchaseOrdersTabContent from './PurchaseOrdersTabContent';
import PropTypes from 'prop-types';

/**
 * React Component for the View Page
 * of a single Supplier. 
 * 
 * Composed of 3 main parts:
 * 1. Header
 *    - Title
 *    - ShowMoreButton (Delete Supplier)
 * 2. Supplier Descriptions
 *    - Contains <EditableItem />s
 * 3. Tabs
 *    - Parts Tab Pane (all parts associated
 *      with this particular supplier)
 *    - Purchase Orders Pane (all purchase
 *      orders associated with this particular
 *      supplier)
 */
export default function SupplierViewPage(props) {
    const history = useHistory();
    const { permissionsList } = useAuth();
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
        return bax.patch(`/api/v1/supplier/${props.match.params.supplierID}`, patchBody)
                  .then(res => {
                        return bax.get(`/api/v1/supplier/${props.match.params.supplierID}`);
                  }).then(res => {
                    setSupplier(res.data);
                    message.success('Supplier Information successfully changed!');
                  })
    }
    
    // Editing Permission (for `showMoreButton` and the 
    // `EditableItem`s in `BilboDescriptions`)
    const isEditingEnabled = permissionsList.includes(PERMS.SUPPLIER_WRITE);
    const title = (
        <div>
            <BilboPageHeader 
                title='Supplier Details'
                onBack={() => history.push(CONFIG.SUPPLIER_URL)}
                extra={[
                    <DeleteSupplierShowMoreButton 
                        key='deleteSupplierShowMoreButton'
                        supplierID={props.match.params.supplierID}
                        disabled={!isEditingEnabled}
                    />
                ]}
            />
            <BilboDivider />
        </div>
    )

    // Note that all fields are editable except the 
    // supplier's name
    return (
        <div>
            <Spin spinning={isLoadingSupplierDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Supplier Name">
                        {supplier.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" >
                        <EditableItem value={supplier.address} 
                                      update={(newAddress) => updateField('address', newAddress)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Telephone" >
                        <EditableItem value={supplier.telephone} 
                                      update={(newTelephone) => updateField('telephone', newTelephone)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Fax" >
                        <EditableItem value={supplier.fax} 
                                      update={(newFax) => updateField('fax', newFax)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" >
                        <EditableItem value={supplier.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      itemType='textArea'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>

            <BilboDivider />

            <Tabs defaultActiveKey='1'>
                <TabPane tab='All Parts' key='1'>
                    <PartsTabContent supplierid={props.match.params.supplierID}/>
                </TabPane>
                <TabPane tab='Purchase Orders' key='2'>
                    <PurchaseOrdersTabContent supplierid={props.match.params.supplierID}/>
                </TabPane>
            </Tabs>
        </div>
    );
}
SupplierViewPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
}

/**
 * Customised `showMoreButton` in `SupplierViewPage` header.
 * Dropdown has option to delete supplier.
 */
function DeleteSupplierShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'deleteSupplier') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to delete this supplier?',
                onOk: () => {
                    bax.delete(`/api/v1/supplier/${props.supplierID}`)
                        .then(res => {
                            if (res.status === 200) {
                                message.success('Successfully deleted supplier');
                                history.push(CONFIG.SUPPLIER_URL);
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
                key='deleteSupplier'
                icon={<DeleteOutlined/>}>
                Delete Supplier
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='deleteSupplierShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
DeleteSupplierShowMoreButton.propTypes = {
    supplierID: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired
}

