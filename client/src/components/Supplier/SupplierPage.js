import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../UtilComponents';
import { Menu, Table } from 'antd';
import { PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * React Component for entire View All Suppliers
 * Page. Consist of 2 main parts:
 * 1. BilboPageHeader
 *    - Title and ShowMoreButton
 * 2. SupplierList 
 *    - Allows for display of list of 
 *      suppliers, searching/filtering
 *      and pagination
 */
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

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addSupplierItem') {
            history.push(`${CONFIG.SUPPLIER_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
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

/**
 * React Component to Display and Filter/Search 
 * the list of Suppliers
 */
function SupplierList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, 
                                                  pageSize: CONFIG.DEFAULT_PAGE_SIZE})

    // State for Filter Queries (Searchable in Table)
    const [APIFilterQuery, setAPIFilterQuery] = useState({
        name: '',
        address: '',
        telephone: '',
        additionalInfo: '',
    });
    const history = useHistory();

    useEffect(() => {
        getSupplierData({
            // When a new search filter is used, go back to the first page
            current: 1,
            pageSize: pagination.pageSize,
        });
    }, [APIFilterQuery])

    // Only makes an API call when the table's pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        // Note that `tablePagination` is different from `pagination`
        // `tablePagination`: from `onChange` in <Table />
        // `pagination`: state in this React component
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getSupplierData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getSupplierData = (pagination) => {
        setIsLoading(true);
        // Send filter in query string
        let filter = JSON.stringify({
            "name": { "$regex": escapeRegex(APIFilterQuery.name), "$options": "i"},
            "address": { "$regex": escapeRegex(APIFilterQuery.address), "$options": "i"},
            "telephone": { "$regex": escapeRegex(APIFilterQuery.telephone), "$options": "i"},
            "additionalInfo": { "$regex": escapeRegex(APIFilterQuery.additionalInfo), "$options": "i"},
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
    
    // Configuration of Columns
    const columns = [
        {
            title: 'Supplier Name',
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('name', 
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('address',
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Telephone',
            dataIndex: 'telephone',
            key: 'telephone',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('telephone', 
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '30%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo', 
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (text, record) => (
                <BilboNavLink to={`${CONFIG.SUPPLIER_URL}/${record._id}`}>
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