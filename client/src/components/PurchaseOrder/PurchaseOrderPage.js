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
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * React component to display all purchase orders
 * according to status. Comprised of 2 main components
 * 1. BilboPageHeader
 *    - Title
 *    - Show More Button (Add a Purchase Order)
 * 2. PurchaseOrderNavigator
 *    - Status Navigator
 *    - Table displaying all Purchase Orders with the
 *      corresponding status
 */
export default function PurchaseOrderPage(props) {
    const { permissionsList } = useAuth();
    return (
        <div>
            <BilboPageHeader
                title='All Purchase Orders'
                subTitle='List of Purchase Orders (By Status)' 
                extra={[
                    <AllPurchaseOrdersShowMoreButton
                        key='allPurchaseOrdersShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.PURCHASE_ORDER_WRITE)}
                    />
                ]}
                />
            <BilboDivider />
            <PurchaseOrderNavigator />
        </div>
    );
}

function AllPurchaseOrdersShowMoreButton(props) {
    const history = useHistory();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addPurchaseOrderItem') {
            history.push(`${CONFIG.PURCHASE_ORDER_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='addPurchaseOrderItem'
                icon={<PlusOutlined />}>
                Add a Purchase Order
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allPurchaseOrdersShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllPurchaseOrdersShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}

/**
 * React component to navigate the different
 * purchase orders according to their status.
 * Comprised of 2 main components:
 * 1. Steps (to navigate status)
 * 2. PurchaseOrderList (to display the purchase
 *    orders that have the status selected
 *    in the steps)
 * @param {object} props 
 */
function PurchaseOrderNavigator(props) {
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
                    CONFIG.PURCHASE_ORDER_STEPS.map(({status, title}) => {
                        if (status === 'CANCELLED') {
                            return <Step key={title} title={title} icon={<StopOutlined/>}/>
                        } else {
                            return <Step key={title} title={title} />
                        }
                    })
                }
            </Steps>
            <PurchaseOrderList status={CONFIG.PURCHASE_ORDER_STEPS[currentStepIndex].status}/>
        </>
    )
}

/**
 * Displays in a table the purchase orders that have latest status
 * corresponding to the selected status in the <Steps/>
 * 
 * Selected status is passed down via `props`.
 * @param {object} props 
 */
function PurchaseOrderList(props) {
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
        getPurchaseOrderMetaData({
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
            getPurchaseOrderMetaData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getPurchaseOrderMetaData = (pagination) => {
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
        bax.get(`/api/v1/purchaseOrder?${query}`, { withCredentials: true })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.purchaseOrders);
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
                <BilboNavLink to={`${CONFIG.PURCHASE_ORDER_URL}/${record._id}`}>
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
PurchaseOrderList.propTypes = {
    status: PropTypes.string.isRequired,
}