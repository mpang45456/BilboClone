import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, BilboPageHeader, BilboDivider, BilboSearchTable } from './UtilComponents';
import { Menu, Table, Input, Button, Row, Space } from 'antd';
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
    const [pagination, setPagination] = useState({current: 1, pageSize: 5})

    // TODO: Experimental
    const [nameFilterQuery, setNameFilterQuery] = useState('');
    const [addressFilterQuery, setAddressFilterQuery] = useState('');
    const [telephoneFilterQuery, setTelephoneFilterQuery] = useState('');
    const history = useHistory();

    useEffect(() => {
        getSupplierData(pagination);
    }, [nameFilterQuery, addressFilterQuery, telephoneFilterQuery])

    // Only makes an API call when the table pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getSupplierData(tablePagination);
        }
    }

    const getSupplierData = (pagination) => {
        setIsLoading(true);
        let filter = JSON.stringify({
            "name": { "$regex": nameFilterQuery, "$options": "i"},
            "address": { "$regex": addressFilterQuery, "$options": "i"},
            "telephone": { "$regex": telephoneFilterQuery, "$options": "i"},
        });
        let query = queryString.stringify({page: pagination.current, 
                                           limit: pagination.pageSize, 
                                           filter});
        bax.get(`/api/v1/supplier?${query}`, { withCredentials: true })
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
                if (err.response.status === 400) {
                    setDataSource([]);
                    setIsLoading(false);
                } else {
                    redirectToErrorPage(err, history);
                }
            })
    }
    
    const columns = [
        {
            title: 'Supplier Name',
            dataIndex: 'name',
            key: 'name',
            ...BilboSearchTable.getColumnSearchProps('name', nameFilterQuery, setNameFilterQuery)
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            ...BilboSearchTable.getColumnSearchProps('address', addressFilterQuery, setAddressFilterQuery)
        },
        {
            title: 'Telephone',
            dataIndex: 'telephone',
            key: 'telephone',
            ...BilboSearchTable.getColumnSearchProps('telephone', telephoneFilterQuery, setTelephoneFilterQuery)
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