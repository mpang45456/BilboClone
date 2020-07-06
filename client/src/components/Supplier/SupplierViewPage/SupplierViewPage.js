import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Spin, Descriptions, Tabs, Modal, Menu, message } from 'antd';
const { TabPane } = Tabs;
const { confirm } = Modal;
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
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

            <SupplierViewPageTabs supplierID={props.match.params.supplierID}/>
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

/**
 * Component rendering the tabs section
 * of <SupplierViewPage />.
 * 
 * Note: Whenever the active tab changes, the 
 * `showMoreButton` associated with the tab 
 * changes it dropdown menu option. See class
 * `TabsShowMoreButton`.
 */
function SupplierViewPageTabs(props) {
    const [activeTab, setActiveTab] = useState('1');

    return (
        <Tabs defaultActiveKey={activeTab}
              onChange={(activeKey) => setActiveTab(activeKey)}
              tabBarExtraContent={<TabsShowMoreButton 
                                    activeTab={activeTab}/>}>
            <TabPane tab='All Parts' key='1'>
                <PartsTabContent supplierid={props.supplierID}/>
            </TabPane>
            <TabPane tab='Purchase Orders' key='2'>
                <PurchaseOrdersTabContent supplierid={props.supplierID}/>
            </TabPane>
        </Tabs>
    )
}
SupplierViewPageTabs.propTypes = {
    supplierID: PropTypes.string.isRequired,
}

/**
 * `showMoreButton` that changes its 
 * dropdown menu option according to the
 * value of `props.activeTab`. 
 * 
 * If `props.activeTab` === '1' ('All Parts' tab):
 * display 'Add a Part'
 * 
 * If `props.activeTab` === '2' ('Purchase Orders' tab):
 * display 'Add a Purchase Order'
 */
function TabsShowMoreButton(props) {
    const history = useHistory();
    const { permissionsList } = useAuth();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addPart') {
            history.push(`${CONFIG.PARTS_URL}add`);
        } else if (key === 'addPurchaseOrder') {
            // TODO: Add implementation for Purchase Orders
            console.log('TO BE IMPLEMENTED');
        }
    }

    const menu = (
        <Menu onClick={buttonClicked}>
            {
                props.activeTab === '1'
                ? <Menu.Item 
                    key='addPart'
                    icon={<PlusOutlined/>}>
                    Add a Part
                  </Menu.Item>
                : <Menu.Item 
                    key='addPurchaseOrder'
                    icon={<PlusOutlined/>}>
                    Add a Purchase Order
                  </Menu.Item>
            }
        </Menu>
    )
    
    // TODO: Update disabled value for Purchase Orders permissions
    return (
        <ShowMoreButton 
            dropdownKey='tabShowMoreDropdown'
            menu={menu}
            disabled={props.activeTab === '1' && !permissionsList.includes(PERMS.PART_WRITE)}
        />
    )
}
TabsShowMoreButton.propTypes = {
    activeTab: PropTypes.string.isRequired,
}