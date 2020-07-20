import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboDisplayOnlySteps,
         BilboNavLink } from '../../UtilComponents';
import { Menu, Modal, Table, Steps, Popover, Spin, message } from 'antd';
const { confirm } = Modal;
const { Step } = Steps;
import { PlusOutlined, StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { SO_STATES } from '../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../utils';
import SalesOrderQuotationContent from './SalesOrderQuotationContent';
import queryString from 'query-string';

/**
 * React Component to display the details of a
 * sales order.
 * 
 * Composed of 3 main components:
 * 1. BilboPageHeader
 *    - Title
 *    - ShowMoreButton (Cancel Sales Order)
 * 2. Steps 
 *    - Displays status (non-interactive)
 * 3. Content
 *    - What is displayed is dependent on 
 *      the current status of the sales order
 */
export default function SalesOrderViewPage(props) {
    const { permissionsList } = useAuth();
    const history = useHistory();
    const [ salesOrderMetaData, setSalesOrderMetaData ] = useState({});
    const [ salesOrderStateData, setSalesOrderStateData ] = useState({});
    const [ isLoadingSalesOrderDetails, setIsLoadingSalesOrderDetails] = useState(true);
    useEffect(() => {
        (async function() {
            // Get Meta-Data
            await bax.get(`/api/v1/salesOrder/${props.match.params.salesOrderID}`)
                .then(res => {
                    if (res.status === 200) {
                        setSalesOrderMetaData(res.data);
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })
    
            // Get State Data
            await bax.get(`/api/v1/salesOrder/${props.match.params.salesOrderID}/state/latest`)
                .then(res => {
                    if (res.status === 200) {
                        setSalesOrderStateData(res.data);
                        setIsLoadingSalesOrderDetails(false);
                    }
                }).catch(err => {
                    setIsLoadingSalesOrderDetails(false);
                    redirectToErrorPage(err, history);
                })
        })();
    }, []) // Run only once (on component mounting)

    function renderSwitcher(latestStatus) {
        switch (latestStatus) {
            case 'QUOTATION':
                return <SalesOrderQuotationContent 
                            salesOrderState={salesOrderStateData} />
            case 'CONFIRMED':
                return <span>CONFIRMED</span>
            case 'PREPARING':
                return <span>PREPARING</span>
            case 'IN_DELIVERY':
                return <span>IN_DELIVERY</span>
            case 'RECEIVED':
                return <span>RECEIVED</span>
            case 'FULFILLED':
                return <span>FULFILLED</span>
            default:
                return <span>LOADING</span>
        }
    }

    return (
        <div>
            <Spin spinning={isLoadingSalesOrderDetails}> 
                <BilboPageHeader 
                    title='Sales Order Details'
                    onBack={() => history.push(CONFIG.SALES_ORDER_URL)}
                    extra={[
                        <CancelSalesOrderShowMoreButton 
                            key='cancelSalesOrderShowMoreButton'
                            salesOrderState={salesOrderStateData}
                            salesOrderID={props.match.params.salesOrderID}
                            disabled={!permissionsList.includes(PERMS.SALES_ORDER_WRITE)}
                        />
                    ]}
                />
                <BilboDivider />
                <BilboDisplayOnlySteps 
                    activeStepIndex={CONFIG.SALES_ORDER_STEPS.findIndex(statusObj => statusObj.status === salesOrderStateData.status)}
                    allStatusAndTitle={CONFIG.SALES_ORDER_STEPS} />
                { renderSwitcher(salesOrderMetaData.latestStatus) }
            </Spin>
        </div>
    );
}

/**
 * Customised `showMoreButton` in `SalesOrderViewPage` header.
 * Dropdown has option to cancel sales order.
 */
function CancelSalesOrderShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'cancelSalesOrder') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to cancel this sales order?',
                onOk: () => {
                    // Make a copy of the current state and update status to CANCELLED
                    const newState = JSON.parse(JSON.stringify(props.salesOrderState));
                    newState.status = SO_STATES.CANCELLED;
                    bax.post(`/api/v1/salesOrder/${props.salesOrderID}/state`, newState)
                        .then(res => {
                            if (res.status === 200) {
                                message.success('Successfully cancelled sales order!');
                                history.push(CONFIG.SALES_ORDER_URL);
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
                key='cancelSalesOrder'
                icon={<StopOutlined/>}>
                Cancel Sales Order
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='cancelSalesOrderShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
CancelSalesOrderShowMoreButton.propTypes = {
    salesOrderState: PropTypes.object.isRequired,
    salesOrderID: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired
}
