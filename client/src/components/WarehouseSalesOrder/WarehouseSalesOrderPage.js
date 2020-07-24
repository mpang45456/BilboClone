import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../UtilComponents';
import { Menu, Table, Steps } from 'antd';
const { Step } = Steps;
import { PlusOutlined, StopOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../server/data/databaseEnum';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * React component to display all sales orders
 * with `SO_STATES.PREPARING` status. This page
 * is only meant for access by warehouse users.
 * 
 * Comprised of 2 main components
 * 1. BilboPageHeader (has no ShowMoreButton)
 *    - Title
 * 2. WarehouseSalesOrderListWithSteps
 *    - Steps (non-interactive)
 *    - Table displaying all Sales Orders with the
 *      `SO_STATES.PREPARING` status
 */
export default function WarehouseSalesOrderPage(props) {
    return (
        <div>
            <BilboPageHeader
                title='Pending Sales Orders'
                subTitle='List of Sales Orders Awaiting Packing and Delivery' 
            />
            <BilboDivider />
            <WarehouseSalesOrderListWithSteps />
        </div>
    );
}

/**
 * React component to display the `SO_STATES.PREPARING`
 * in <Steps/> and also a list of sales orders
 * that currently have that status.
 *  
 * Comprised of 2 main components:
 * 1. Steps (non-interactive)
 * 2. WarehouseSalesOrderList (to display the sales
 *    orders that have the `SO_STATES.PREPARING` status
 * @param {object} props 
 */
function WarehouseSalesOrderListWithSteps(props) {
    const currentStepIndex = CONFIG.SALES_ORDER_STEPS.findIndex(statusAndTitle => statusAndTitle.status === SO_STATES.PREPARING);
    return (
        <>
            <Steps type='navigation'
                   size='small'
                   current={currentStepIndex}
            >
                {
                    CONFIG.SALES_ORDER_STEPS.map(({status, title}) => {
                        if (status === 'CANCELLED') {
                            return <Step key={title} title={title} icon={<StopOutlined/>}/>
                        } else {
                            return <Step key={title} title={title} />
                        }
                    })
                }
            </Steps>
            <WarehouseSalesOrderList status={CONFIG.SALES_ORDER_STEPS[currentStepIndex].status}/>
        </>
    )
}

/**
 * Displays in a table the sales orders that have
 * status `SO_STATES.PREPARING`.
 * 
 * The table's `createdBy`, `orderNumber` and 
 * `additionalInfo` fields are searchable.
 */
function WarehouseSalesOrderList(props) {
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
        bax.get(`/api/v1/warehouse/salesOrder?${query}`, { withCredentials: true })
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
                <BilboNavLink to={`${CONFIG.WAREHOUSE_SALES_ORDER_URL}/${record._id}`}>
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
WarehouseSalesOrderList.propTypes = {
    status: PropTypes.string.isRequired,
}