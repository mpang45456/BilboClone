import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../../UtilComponents';
import { Menu, Modal, Table, Steps, Popover } from 'antd';
const { confirm } = Modal;
const { Step } = Steps;
import { PlusOutlined, StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { SO_STATES } from '../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../utils';
import queryString from 'query-string';

/**
 * // TODO: Update docs
 */
export default function SalesOrderViewPage(props) {
    const { permissionsList } = useAuth();
    const history = useHistory();
    const [ salesOrderMetaData, setSalesOrderMetaData ] = useState({ latestStatus: CONFIG.SALES_ORDER_STEPS[0].status });
    const [ isLoadingSalesOrderDetails, setIsLoadingSalesOrderDetails] = useState(true);
    useEffect(() => {
        // Get Meta-Data
        bax.get(`/api/v1/salesOrder/${props.match.params.salesOrderID}`)
            .then(res => {
                if (res.status === 200) {
                    setSalesOrderMetaData(res.data);
                    setIsLoadingSalesOrderDetails(false);
                }
            }).catch(err => {
                setIsLoadingSalesOrderDetails(false);
                redirectToErrorPage(err, history);
            })
    }, []) // Run only once (on component mounting)

    function renderSwitcher(latestStatus) {
        switch (latestStatus) {
            case 'QUOTATION':
                return <span>QUOTATION</span>
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
        }
    }

    return (
        <div>
            <BilboPageHeader 
                title='Sales Order Details'
                onBack={() => history.push(CONFIG.SALES_ORDER_URL)}
                extra={[
                    <CancelSalesOrderShowMoreButton 
                        key='cancelSalesOrderShowMoreButton'
                        salesOrderState={{test:'TO BE IMPLEMENTED'}}
                        salesOrderID={props.match.params.salesOrderID}
                        disabled={!permissionsList.includes(PERMS.SALES_ORDER_WRITE)}
                    />
                ]}
            />
            <BilboDivider />
            <SalesOrderDisplaySteps status={salesOrderMetaData.latestStatus} />
            { renderSwitcher(salesOrderMetaData.latestStatus) }
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

function SalesOrderDisplaySteps(props) {
    const stepIndex = CONFIG.SALES_ORDER_STEPS.findIndex(statusObj => statusObj.status === props.status);
    return (
        <>
            <Steps type='navigation'
                   size='small'
                   current={stepIndex}>
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
        </>
    )
}
SalesOrderDisplaySteps.propTypes = {
    // SO_STATES.<status>
    status: PropTypes.string.isRequired,
}

function SalesOrderQuotationStatusPage(props) {

}