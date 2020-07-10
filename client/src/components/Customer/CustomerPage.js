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
 * React Component for entire View All Customers
 * Page. Consist of 2 main parts:
 * 1. BilboPageHeader
 *    - Title and ShowMoreButton
 * 2. CustomerList 
 *    - Allows for display of list of 
 *      customers, searching/filtering
 *      and pagination
 */
export default function CustomerPage(props) {
    const { permissionsList } = useAuth();
    return (
        <div>
            <BilboPageHeader
                title='All Customers'
                subTitle='List of All Customers'
                extra={[
                    <AllCustomersShowMoreButton
                        key='allCustomersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.CUSTOMER_WRITE)}
                    />
                ]}
            />
            <BilboDivider />
            <CustomerList />
        </div>
    );
}

function AllCustomersShowMoreButton(props) {
    const history = useHistory();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addCustomerItem') {
            history.push(`${CONFIG.CUSTOMER_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='addCustomerItem'
                icon={<PlusOutlined />}>
                Add a Customer
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allCustomersShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllCustomersShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}

/**
 * React Component to Display and Filter/Search 
 * the list of Customers
 */
function CustomerList(props) {
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
        getCustomerData({
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
            getCustomerData(tablePagination);
        }
    }

    // API call to obtain customer data
    const getCustomerData = (pagination) => {
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
        bax.get(`/api/v1/customer?${query}`, { withCredentials: true })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.customers);
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
            title: 'Customer Name',
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
                <BilboNavLink to={`${CONFIG.CUSTOMER_URL}/${record._id}`}>
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