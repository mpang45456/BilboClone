import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Spin, Descriptions, Tabs, Modal, Menu, message, Table, Tag } from 'antd';
const { TabPane } = Tabs;
const { confirm } = Modal;
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../context/AuthContext';
import CONFIG from '../config';
import { BilboDescriptions, BilboPageHeader, BilboDivider, EditableItem, ShowMoreButton, BilboSearchTable, BilboNavLink } from './UtilComponents';
import queryString from 'query-string';
import PropTypes from 'prop-types';

/**
 * React Component for the View Page
 * of a single Supplier. 
 * 
 * // TODO: Update docs
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

    // TODO: Should be able to set style for Descriptions.Item once (using styled components?)
    return (
        <div>
            <Spin spinning={isLoadingSupplierDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Supplier Name" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.name} 
                                      update={(newName) => updateField('name', newName)}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.address} 
                                      update={(newAddress) => updateField('address', newAddress)}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Telephone" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.telephone} 
                                      update={(newTelephone) => updateField('telephone', newTelephone)}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Fax" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.fax} 
                                      update={(newFax) => updateField('fax', newFax)}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      isTextArea={true}
                                      isEditingEnabled={isEditingEnabled} />
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>

            <BilboDivider />
            <Tabs defaultActiveKey='1'>
                <TabPane tab='All Parts' key='1'>
                    <SupplierSpecificPartsList supplierid={props.match.params.supplierID}/>
                </TabPane>
                <TabPane tab='Purchase Orders' key='2'>
                    Associated Purchase Orders
                </TabPane>
            </Tabs>
        </div>
    );
}

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

// TODO: Specific to the current supplier
// TODO: Refactor into 'PartsTabContent'
function SupplierSpecificPartsList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, pageSize: 10}) // TODO: Abstract this into CONFIG after completion

    // State for Filter Queries
    const [partNumberFilterQuery, setPartNumberFilterQuery] = useState('');
    const [descriptionFilterQuery, setDescriptionFilterQuery] = useState('');
    const [statusFilterQuery, setStatusFilterQuery] = useState('');
    const [additionalInfoFilterQuery, setAdditionalInfoFilterQuery] = useState('');
    const history = useHistory();

    useEffect(() => {
        console.log('use effect')
        getPartsData(pagination);
    }, [partNumberFilterQuery, descriptionFilterQuery, statusFilterQuery, additionalInfoFilterQuery])

    // Only makes an API call when the table's pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        // Note that `tablePagination` is different from `pagination`
        // `tablePagination`: from `onChange` in <Table />
        // `pagination`: state in this React component
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getPartsData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getPartsData = (pagination) => {
        setIsLoading(true);
        // Send filter in query string
        let filter = JSON.stringify({
            "supplier": props.supplierid, // TODO: Add this to PropTypes
            "partNumber": { "$regex": partNumberFilterQuery, "$options": "i"},
            "description": { "$regex": descriptionFilterQuery, "$options": "i"},
            "status": { "$regex": statusFilterQuery, "$options": "i"},
            "additionalInfo": { "$regex": additionalInfoFilterQuery, "$options": "i"},
        });
        let query = queryString.stringify({page: pagination.current, 
                                           limit: pagination.pageSize, 
                                           filter});
        bax.get(`/api/v1/part?${query}`, { withCredentials: true })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.parts);
                    setPagination({
                        current: res.data.currentPage,
                        pageSize: pagination.pageSize,
                        total: res.data.totalPages * pagination.pageSize,
                    })
                    setIsLoading(false);
                }
            }).catch(err => {
                if (err.response.status === 400) {
                    setDataSource([]);
                    setIsLoading(false);
                } else {
                    redirectToErrorPage(err, history);
                }
            })
    }
    
    // Configuration of Columns
    const columns = [
        {
            title: 'Part Number',
            dataIndex: 'partNumber',
            key: 'partNumber',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('partNumber', partNumberFilterQuery, setPartNumberFilterQuery)
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('description', descriptionFilterQuery, setDescriptionFilterQuery)
        },
        {
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '30%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo', additionalInfoFilterQuery, setAdditionalInfoFilterQuery)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            ...BilboSearchTable.getColumnSearchProps('status', statusFilterQuery, setStatusFilterQuery),
            render: status => (
                <Tag color={status==='ACTIVE' ? CONFIG.ACTIVE_TAG_COLOR : CONFIG.ARCHIVED_TAG_COLOR} key={status}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (text, record) => (
                <BilboNavLink to={`${CONFIG.PARTS_URL}/${record._id}`}>
                    view
                </BilboNavLink>
            ),
        },
    ]

    return (
        <Table columns={columns} 
               dataSource={dataSource}
               rowKey={record => record._id}
               loading={isLoading}
               pagination={pagination}
               onChange={handleTableChange}
               bordered
        />
    )
}