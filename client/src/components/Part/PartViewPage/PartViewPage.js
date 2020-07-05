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
import PropTypes from 'prop-types';
import queryString from 'query-string';

/**
 * React component for the View Page of a 
 * single Part.
 * 
 * Composed of 3 main aprts:
 * 1. Header
 *    - Title
 *    - ShowMoreButton (Delete Part)
 * 2. Part Descriptions
 *    - Contains <EditableItem />s (with the exception
 *      of the supplier name field)
 * 3. Tabs
 *    - Price History Tab Pane (Displays the 
 *      price history of the part, as well as 
 *      a button to add to the price history)
 *    - Inventory Tab Pane (shows Purchase Orders
 *      and Sales Orders related to this part
 *      and their expected fulfillment dates
 *      and quantities.)
 */
export default function PartViewPage(props) {
    const history = useHistory();
    const { permissionsList } = useAuth();
    const [isLoadingPartDetails, setIsLoadingPartDetails] = useState(true);
    const [part, setPart] = useState({});

    useEffect(() => {
        // Populate the `supplier`'s `name` field
        let query = queryString.stringify({supplierPopulate: 'name'});
        bax.get(`/api/v1/part/${props.match.params.partID}?${query}`)
            .then(res => {
                if (res.status === 200) {
                    setPart(res.data);
                    setIsLoadingPartDetails(false);
                }
            }).catch(err => {
                setIsLoadingPartDetails(false);
                redirectToErrorPage(err, history);
            })
    }, [props.location])

    // General function to make API PATCH call when a field is edited and saved
    // Returns a promise (child component is supposed to implement `catch` handler)
    const updateField = (fieldName, newFieldValue) => {
        // Populate the `supplier`'s `name` field
        let query = queryString.stringify({supplierPopulate: 'name'});
        // Populate body of PATCH API call
        let patchBody = {};
        patchBody[fieldName] = newFieldValue;
        return bax.patch(`/api/v1/part/${props.match.params.partID}`, patchBody)
                  .then(res => {
                        // Obtain updated part information (to update UI)
                        return bax.get(`/api/v1/part/${props.match.params.partID}?${query}`);
                  }).then(res => {
                    setPart(res.data);
                    message.success('Part Information successfully changed!');
                  })
    }
    
    // Editing Permission (for `showMoreButton` and the 
    // `EditableItem`s in `BilboDescriptions`)
    const isEditingEnabled = permissionsList.includes(PERMS.PART_WRITE);
    const title = (
        <div>
            <BilboPageHeader 
                title='Part Details'
                onBack={() => history.push(CONFIG.PARTS_URL)}
                extra={[
                    <DeletePartShowMoreButton 
                        key='deletePartShowMoreButton'
                        partID={props.match.params.partID}
                        disabled={!isEditingEnabled}
                    />
                ]}
            />
            <BilboDivider />
        </div>
    )

    // Note that all fields are editable except the 
    // supplier's name.
    return (
        <div>
            <Spin spinning={isLoadingPartDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Supplier Name">
                        {part.supplier? part.supplier.name : ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Part Number" >
                        <EditableItem value={part.partNumber} 
                                      update={(newPartNumber) => updateField('partNumber', newPartNumber)}
                                      itemType='input'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" >
                        <EditableItem value={part.description}
                                      update={(newDescription) => updateField('description', newDescription)}
                                      itemType='textArea'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Status" >
                        <EditableItem value={part.status} 
                                      update={(newStatus) => updateField('status', newStatus)}
                                      itemType='selectWithTags'
                                      tagOptions={[{value: 'ACTIVE', color: CONFIG.ACTIVE_TAG_COLOR}, {value: 'ARCHIVED', color: CONFIG.ARCHIVED_TAG_COLOR}]}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" >
                        <EditableItem value={part.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      itemType='textArea'
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>

            <BilboDivider />

            <Tabs defaultActiveKey='1'>
                <TabPane tab='Price History' key='1'>
                    Insert Price History Tab Pane
                </TabPane>
                <TabPane tab='Inventory' key='2'>
                    Insert Inventory Tab Pane
                </TabPane>
            </Tabs>
        </div>
    );
}
PartViewPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
}

/**
 * Customised `showMoreButton` in `PartViewPage` header.
 * Dropdown has option to delete part.
 */
function DeletePartShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'deletePart') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to delete this part?',
                onOk: () => {
                    bax.delete(`/api/v1/part/${props.partID}`)
                        .then(res => {
                            if (res.status === 200) {
                                message.success('Successfully deleted part');
                                history.push(CONFIG.PARTS_URL);
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
                key='deletePart'
                icon={<DeleteOutlined/>}>
                Delete Part
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='deletePartShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
DeletePartShowMoreButton.propTypes = {
    partID: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired
}

