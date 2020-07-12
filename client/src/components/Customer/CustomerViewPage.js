import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Spin, Descriptions, Modal, Menu, message } from 'antd';
const { confirm } = Modal;
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../context/AuthContext';
import CONFIG from '../../config';
import { BilboDescriptions, 
         BilboPageHeader, 
         BilboDivider, 
         EditableItem, 
         ShowMoreButton } from '../UtilComponents';
import PropTypes from 'prop-types';

/**
 * React Component for the View Page
 * of a single Customer. 
 * 
 * Composed of 3 main parts:
 * 1. Header
 *    - Title
 *    - ShowMoreButton (Delete Customer)
 * 2. Customer Descriptions
 *    - Contains <EditableItem />s
 * 3. Associated Sales Orders
 *    - //TODO: To Be Implemented
 */
export default function CustomerViewPage(props) {
    const history = useHistory();
    const { permissionsList } = useAuth();
    const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(true);
    const [customer, setCustomer] = useState({});

    useEffect(() => {
        bax.get(`/api/v1/customer/${props.match.params.customerID}`)
            .then(res => {
                if (res.status === 200) {
                    setCustomer(res.data);
                    setIsLoadingCustomerDetails(false);
                }
            }).catch(err => {
                setIsLoadingCustomerDetails(false);
                redirectToErrorPage(err, history);
            })
    }, [props.location])

    // General function to make API PATCH call when a field is edited and saved
    // Returns a promise (child component is supposed to implement `catch` handler)
    const updateField = (fieldName, newFieldValue) => {
        let patchBody = {};
        patchBody[fieldName] = newFieldValue;
        return bax.patch(`/api/v1/customer/${props.match.params.customerID}`, patchBody)
                  .then(res => {
                        return bax.get(`/api/v1/customer/${props.match.params.customerID}`);
                  }).then(res => {
                    setCustomer(res.data);
                    message.success('Customer Information successfully changed!');
                  })
    }
    
    // Editing Permission (for `showMoreButton` and the 
    // `EditableItem`s in `BilboDescriptions`)
    const isEditingEnabled = permissionsList.includes(PERMS.CUSTOMER_WRITE);
    const title = (
        <div>
            <BilboPageHeader 
                title='Customer Details'
                onBack={() => history.push(CONFIG.CUSTOMER_URL)}
                extra={[
                    <DeleteCustomerShowMoreButton 
                        key='deleteCustomerShowMoreButton'
                        customerID={props.match.params.customerID}
                        disabled={!isEditingEnabled}
                    />
                ]}
            />
            <BilboDivider />
        </div>
    )

    // Note that all fields are editable except the 
    // customer's name
    return (
        <div>
            <Spin spinning={isLoadingCustomerDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Customer Name">
                        {customer.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" >
                        <EditableItem value={customer.address} 
                                      update={(newAddress) => updateField('address', newAddress)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Telephone" >
                        <EditableItem value={customer.telephone} 
                                      update={(newTelephone) => updateField('telephone', newTelephone)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Fax" >
                        <EditableItem value={customer.fax} 
                                      update={(newFax) => updateField('fax', newFax)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Email" >
                        <EditableItem value={customer.email} 
                                      update={(newEmail) => updateField('email', newEmail)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Point Of Contact" >
                        <EditableItem value={customer.pointOfContact} 
                                      update={(newPointOfContact) => updateField('pointOfContact', newPointOfContact)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" >
                        <EditableItem value={customer.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      itemType='textArea'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>

            <BilboDivider />

            <SalesOrderSection />
        </div>
    );
}
CustomerViewPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
}

/**
 * Customised `showMoreButton` in `CustomerViewPage` header.
 * Dropdown has option to delete customer.
 */
function DeleteCustomerShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'deleteCustomer') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to delete this customer?',
                onOk: () => {
                    bax.delete(`/api/v1/customer/${props.customerID}`)
                        .then(res => {
                            if (res.status === 200) {
                                message.success('Successfully deleted customer!');
                                history.push(CONFIG.CUSTOMER_URL);
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
                key='deleteCustomer'
                icon={<DeleteOutlined/>}>
                Delete Customer
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='deleteCustomerShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
DeleteCustomerShowMoreButton.propTypes = {
    customerID: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired
}

function SalesOrderSection(props) {
    // TODO: To be Implemented
    return (
        <>
            <h3>Sales Orders</h3>
            <p>To Be Implemented</p>
        </>
    )
}
