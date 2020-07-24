import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboTabs,
         BilboPageHeader, 
         BilboDivider, 
         BilboDisplayOnlySteps } from '../../UtilComponents';
import { Menu, Modal, Tabs, Spin, message } from 'antd';
const { TabPane } = Tabs;
const { confirm } = Modal;
import { StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { PO_STATES } from '../../../../../server/data/databaseEnum';
import PurchaseOrderQuotationContent from './QuotationStatus/PurchaseOrderQuotationContent';
import PurchaseOrderConfirmedContent from './ConfirmedStatus/PurchaseOrderConfirmedContent';
import PurchaseOrderReceivedContent from './ReceivedStatus/PurchaseOrderReceivedContent';
import PurchaseOrderFulfilledContent from './FulfilledStatus/PurchaseOrderFulfilledContent';
import PurchaseOrderCancelledContent from './CancelledStatus/PurchaseOrderCancelledContent';
import EditHistory from './EditHistory/EditHistory';
import queryString from 'query-string';
import { isEmpty } from 'lodash';

/**
 * React Component to display the details of a
 * purchase order.
 * 
 * Composed of 3 main components:
 * 1. BilboPageHeader
 *    - Title
 *    - ShowMoreButton (Cancel Purchase Order)
 * 2. Steps 
 *    - Displays status (non-interactive)
 * 3. Content
 *    - What is displayed is dependent on 
 *      the current status of the purchase order
 * 
 * Note: `purchaseOrderStateData` has format: 
 * {
 *      additionalInfo
 *      status
 *      updatedBy
 *      createdAt
 *      updatedAt
 *      parts: [{
 *          additionalInfo
 *          fulfilledFor: []
 *          part (partObjID)
 *          partNumber (Part Number (Supplier Name))
 *          quantity
 *      }]
 * }
 */
export default function PurchaseOrderViewPage(props) {
    const { permissionsList } = useAuth();
    const history = useHistory();
    const [ purchaseOrderMetaData, setPurchaseOrderMetaData ] = useState({});
    const [ purchaseOrderStateData, setPurchaseOrderStateData ] = useState({});
    const [ isLoadingPurchaseOrderDetails, setIsLoadingPurchaseOrderDetails] = useState(true);
    useEffect(() => {
        (async function() {
            // Get Meta-Data
            await bax.get(`/api/v1/purchaseOrder/${props.match.params.purchaseOrderID}`)
                .then(res => {
                    if (res.status === 200) {
                        setPurchaseOrderMetaData(res.data);
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })
    
            // Get State Data
            let stateData = null;
            const query = queryString.stringify({ populateFulfilledFor: true });
            await bax.get(`/api/v1/purchaseOrder/${props.match.params.purchaseOrderID}/state/latest?${query}`)
                .then(res => {
                    if (res.status === 200) {
                        stateData = res.data;
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })

            // Populate State Data with Part's Part Number and Supplier Name
            await Promise.all(stateData.parts.map(async part => {
                const query = queryString.stringify({inc: ['partNumber', 'priceHistory'], supplierPopulate: ['name']});
                await bax.get(`/api/v1/part/${part.part}?${query}`)
                         .then(res => {
                             part.partNumber = `${res.data.partNumber} (${res.data.supplier.name})`;
                             part.latestPrice = res.data.priceHistory[res.data.priceHistory.length - 1].unitPrice;
                         })
            })).then(_ => {
                setPurchaseOrderStateData(stateData);
                setIsLoadingPurchaseOrderDetails(false);
            }).catch(err => {
                setIsLoadingPurchaseOrderDetails(false);
                redirectToErrorPage(err, history);
            })
        })();
    }, []) // Run only once (on component mounting)

    // Only called when `purchaseOrderMetaData`
    // and `purchaseOrderStateData` have been loaded
    // by the API call. See return statement of this
    // function component for details. This guarantees
    // that the rendered status content components have
    // non-empty meta and state data to work with.
    function renderSwitcher(latestStatus) {
        switch (latestStatus) {
            case 'QUOTATION':
                return <PurchaseOrderQuotationContent 
                            purchaseOrderStateData={purchaseOrderStateData} 
                            purchaseOrderMetaData={purchaseOrderMetaData}
                            />
            case 'CONFIRMED':
                return <PurchaseOrderConfirmedContent 
                            purchaseOrderStateData={purchaseOrderStateData} 
                            purchaseOrderMetaData={purchaseOrderMetaData}
                            />
            case 'RECEIVED':
                return <PurchaseOrderReceivedContent 
                            purchaseOrderStateData={purchaseOrderStateData} 
                            purchaseOrderMetaData={purchaseOrderMetaData}
                            />
            case 'FULFILLED':
                return <PurchaseOrderFulfilledContent 
                            purchaseOrderStateData={purchaseOrderStateData} 
                            purchaseOrderMetaData={purchaseOrderMetaData}
                            />
            case 'CANCELLED':
                return <PurchaseOrderCancelledContent 
                            purchaseOrderStateData={purchaseOrderStateData} 
                            purchaseOrderMetaData={purchaseOrderMetaData}
                            />
            default:
                return <Spin>Loading</Spin>
        }
    }

    return (
        <div>
            <Spin spinning={isLoadingPurchaseOrderDetails}> 
                <BilboPageHeader 
                    title='Purchase Order Details'
                    onBack={() => history.push(CONFIG.PURCHASE_ORDER_URL)}
                    extra={[
                        <CancelPurchaseOrderShowMoreButton 
                            key='cancelPurchaseOrderShowMoreButton'
                            purchaseOrderState={purchaseOrderStateData}
                            purchaseOrderID={props.match.params.purchaseOrderID}
                            disabled={!permissionsList.includes(PERMS.PURCHASE_ORDER_WRITE)}
                        />
                    ]}
                />
                <BilboDivider />
                <BilboTabs type='card'>
                    <TabPane tab='Details' key='1'>
                        <BilboDisplayOnlySteps 
                            activeStepIndex={CONFIG.PURCHASE_ORDER_STEPS.findIndex(statusObj => statusObj.status === purchaseOrderStateData.status)}
                            allStatusAndTitle={CONFIG.PURCHASE_ORDER_STEPS} />
                        { 
                            !isEmpty(purchaseOrderMetaData) &&
                            !isEmpty(purchaseOrderStateData) &&
                            renderSwitcher(purchaseOrderMetaData.latestStatus) 
                        }
                    </TabPane>
                    <TabPane tab='Edit History' key='2'>
                        <EditHistory 
                            purchaseOrderMetaData={purchaseOrderMetaData} 
                        />
                    </TabPane>
                </BilboTabs>
            </Spin>
        </div>
    );
}

/**
 * Customised `showMoreButton` in `PurchaseOrderViewPage` header.
 * Dropdown has option to cancel purchase order.
 */
function CancelPurchaseOrderShowMoreButton(props) {
    const history = useHistory();

    // Handler when Delete Button is clicked on (will display a modal)
    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'cancelPurchaseOrder') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to cancel this purchase order?',
                onOk: () => {
                    // Make a copy of the current state and update status to CANCELLED
                    const newState = JSON.parse(JSON.stringify(props.purchaseOrderState));
                    newState.status = PO_STATES.CANCELLED;
                    bax.post(`/api/v1/purchaseOrder/${props.purchaseOrderID}/state`, newState)
                        .then(res => {
                            if (res.status === 200) {
                                message.success('Successfully cancelled purchase order!');
                                history.push(CONFIG.PURCHASE_ORDER_URL);
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
                key='cancelPurchaseOrder'
                icon={<StopOutlined/>}>
                Cancel Purchase Order
            </Menu.Item>
        </Menu>
    )
    return (
        <ShowMoreButton 
            dropdownKey='cancelPurchaseOrderShowMoreDropdown'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
CancelPurchaseOrderShowMoreButton.propTypes = {
    purchaseOrderState: PropTypes.object.isRequired,
    purchaseOrderID: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired
}
