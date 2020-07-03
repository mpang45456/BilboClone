import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, BilboPageHeader, BilboDivider } from './UtilComponents';
import { Menu, Table, Input, Button } from 'antd';
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../context/AuthContext';
import queryString from 'query-string';

export default function SupplierPage(props) {
    const { permissionsList } = useAuth();
    return (
        <div>
            <BilboPageHeader
                title='All Suppliers'
                subTitle='List of All Suppliers'
                extra={[
                    <AllSuppliersShowMoreButton
                        key='allSuppliersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.SUPPLIER_WRITE)}
                    />
                ]}
            />
            <BilboDivider />

            <SupplierList />
        </div>
    );
}

function AllSuppliersShowMoreButton(props) {
    const history = useHistory();

    // TODO: Add click handler for `addSupplier` menu item
    const menu = (
        <Menu>
            <Menu.Item
                key='addSupplierItem'
                icon={<PlusOutlined />}>
                Add a Supplier
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allSuppliersShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllSuppliersShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}

function SupplierList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, pageSize: 10})

    // TODO: Experimental
    const [nameSearchKey, setNameSearchKey] = useState('');

    useEffect(() => {
        getSupplierData(pagination);
    }, []) //TODO: for now, run only on component mounting

    const handleTableChange = (pagination, filters, sorter) => {
        getSupplierData(pagination);
    }

    const getSupplierData = (pagination) => {
        setIsLoading(true);
        let query = queryString.stringify({page: pagination.current, limit: pagination.pageSize});
        bax.get(`/api/v1/supplier?${query}`, { 
            withCredentials: true,
            data: {
                "name": { "$regex": nameSearchKey, "$options": "i"}
            }
            })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.suppliers);
                    setPagination({
                        current: res.data.currentPage,
                        pageSize: pagination.pageSize,
                        total: res.data.totalPages * pagination.pageSize,
                    })
                    setIsLoading(false);
                }
            }).catch(err => {
                redirectToErrorPage(err);
            })
    }

    const columns = [
        {
            title: 'Supplier Name',
            dataIndex: 'name',
            key: 'name',
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                return (
                    <div>
                        <Input placeholder='Search Supplier Name'
                            value={nameSearchKey}
                            onChange={e => setNameSearchKey(e.target.value)}
                            onPressEnter={() => {getSupplierData(pagination)}}
                            style={{width: 188, marginBottom: 8, display: 'block'}}
                        />
                        <Button type='primary'
                                onClick={() => {getSupplierData(pagination)}}
                                icon={<SearchOutlined />}
                                size="small"
                                style={{ width: 90 }}>
                            Search
                        </Button>
                    </div>
                )
            },
            filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address'
        },
        {
            title: 'Telephone',
            dataIndex: 'telephone',
            key: 'telephone'
        },
    ]

    return (
        <Table columns={columns} 
               dataSource={dataSource}
               rowKey={record => record._id}
               loading={isLoading}
               pagination={pagination}
               onChange={handleTableChange}
        />
    )
}