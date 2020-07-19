import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../UtilComponents';
import { Menu, Table, Steps, Popover } from 'antd';
const { Step } = Steps;
import { PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { SO_STATES } from '../../../../server/data/databaseEnum';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * React component to display all sales orders
 * according to status. Comprised of 2 main components
 * 1. BilboPageHeader
 *    - Title
 *    - Show More Button (Add a Sales Order)
 * 2. SalesOrderNavigator
 *    - Status Navigator
 *    - Table displaying all Sales Orders with the
 *      corresponding status
 * @param {object} props 
 */
export default function SalesOrderPage(props) {
    const { permissionsList } = useAuth();
    return (
        <div>
            <BilboPageHeader
                title='All Sales Orders'
                subTitle='List of Sales Orders (By Status)' 
                extra={[
                    <AllSalesOrdersShowMoreButton
                        key='allSalesOrdersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.SALES_ORDER_WRITE)}
                    />
                ]}
                />
            <BilboDivider />
            <SalesOrderNavigator />
        </div>
    );
}

function AllSalesOrdersShowMoreButton(props) {
    const history = useHistory();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addSalesOrderItem') {
            history.push(`${CONFIG.SALES_ORDER_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='addSalesOrderItem'
                icon={<PlusOutlined />}>
                Add a Sales Order
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allSalesOrdersShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllSalesOrdersShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}

/**
 * React component to navigate the different
 * sales orders according to their status.
 * Comprised of 2 main components:
 * 1. Steps (to navigate status)
 * 2. SalesOrderList (to display the sales
 *    orders that have the status selected
 *    in the steps)
 * @param {object} props 
 */
function SalesOrderNavigator(props) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const onChange = (newStepIndex) => {
        setCurrentStepIndex(newStepIndex);
    }

    return (
        <>
            <Steps type='navigation'
            size='small'
                   current={currentStepIndex}
                   onChange={onChange} >
                {
                    CONFIG.SALES_ORDER_STEPS.map(({status, title}) => {
                        return <Step key={title} title={title} />
                    })
                }

            </Steps>
            <SalesOrderList status={CONFIG.SALES_ORDER_STEPS[currentStepIndex].status}/>
        </>
    )
}

/**
 * Displays in a table the sales orders that have latest status
 * corresponding to the selected status in the <Steps/>
 * 
 * Selected status is passed down via `props`.
 * @param {object} props 
 */
function SalesOrderList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, 
                                                  pageSize: CONFIG.DEFAULT_PAGE_SIZE})

    // State for Filter Queries (Searchable in Table)
    const [APIFilterQuery, setAPIFilterQuery] = useState({
        createdBy: '',
        orderNumber: '',
        additionalInfo: '',
    });
    const history = useHistory();

    useEffect(() => {
        getSalesOrderMetaData({
            // When a new search filter is used, go back to the first page
            current: 1,
            pageSize: pagination.pageSize,
        });
    }, [APIFilterQuery, props.status])

    // Only makes an API call when the table's pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        // Note that `tablePagination` is different from `pagination`
        // `tablePagination`: from `onChange` in <Table />
        // `pagination`: state in this React component
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getSalesOrderMetaData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getSalesOrderMetaData = (pagination) => {
        setIsLoading(true);
        // Send filter in query string
        let filter = JSON.stringify({
            "latestStatus": props.status,
            "createdBy": { "$regex": escapeRegex(APIFilterQuery.createdBy), "$options": "i"},
            "orderNumber": { "$regex": escapeRegex(APIFilterQuery.orderNumber), "$options": "i"},
            "additionalInfo": { "$regex": escapeRegex(APIFilterQuery.additionalInfo), "$options": "i"},
        });
        let query = queryString.stringify({page: pagination.current, 
                                           limit: pagination.pageSize, 
                                           filter});
        bax.get(`/api/v1/salesOrder?${query}`, { withCredentials: true })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.salesOrders);
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
            title: 'Order Number',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            width: '15%',
            ...BilboSearchTable.getColumnSearchProps('orderNumber', 
                                                        APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
            width: '15%',
            ...BilboSearchTable.getColumnSearchProps('createdBy',
                                                        APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '60%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo', 
                                                        APIFilterQuery, setAPIFilterQuery,
                                                        'info')
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (text, record) => (
                <BilboNavLink to={`${CONFIG.SALES_ORDER_URL}/${record._id}`}>
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
SalesOrderList.propTypes = {
    status: PropTypes.string.isRequired,
}