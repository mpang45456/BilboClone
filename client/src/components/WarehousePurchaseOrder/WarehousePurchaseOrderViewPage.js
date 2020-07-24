import React, {useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText,
         BilboPageHeader,
         BilboDivider } from '../UtilComponents';
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Spin, Row, Space, Button, message, Modal } from 'antd';
const { confirm } = Modal;
import { bax, redirectToErrorPage } from '../../context/AuthContext';
import { PO_STATES } from '../../../../server/data/databaseEnum';
import CONFIG from '../../config';
import CollapsiblePurchaseOrderDataDisplay from '../PurchaseOrder/PurchaseOrderViewPage/CollapsiblePurchaseOrderDataDisplay';

/**
 * React Component to render purchase order details
 * for a warehouse user. Has a `Confirm and Proceed`
 * button that is to be used when the purchase order
 * has been packed and sent for delivery to customer. 
 */
export default function WarehousePurchaseOrderViewPage(props) {
    const history = useHistory();
    const [purchaseOrderMetaData, setPurchaseOrderMetaData] = useState({});
    const [purchaseOrderStateData, setPurchaseOrderStateData] = useState({});
    const [isLoadingPurchaseOrderDetails, setIsLoadingPurchaseOrderDetails] = useState(true);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);

    useEffect(() => {
        (async function() {
            // Get Meta-Data and State Data
            await bax.get(`/api/v1/warehouse/purchaseOrder/${props.match.params.purchaseOrderID}`)
                .then(res => {
                    if (res.status === 200) {
                        // Transform partNumber to include supplier name
                        res.data.state.parts.map(partInfo => {
                            partInfo.partNumber = `${partInfo.part.partNumber} (${partInfo.part.supplier.name})`
                            partInfo.latestPrice = partInfo.part.priceHistory[partInfo.part.priceHistory.length - 1].unitPrice;
                        })
                        setPurchaseOrderStateData(res.data.state);
                        const metaData = JSON.parse(JSON.stringify(res.data));
                        delete metaData.state;
                        setPurchaseOrderMetaData(metaData);
                        setIsLoadingPurchaseOrderDetails(false);
                    }
                }).catch(err => {
                    setIsLoadingPurchaseOrderDetails(false);
                    redirectToErrorPage(err, history);
                })
        })();
    }, []) // Run only once (on component mounting)

    // Handler when `Confirm and Proceed` button is clicked on
    const proceedNextStatus = () => {
        confirm({
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you wish to move this purchase order to the next status? This is NOT reversible.',
            onOk: () => {
                setProceedNextStatusLoading(true);
                bax.patch(`/api/v1/warehouse/purchaseOrder/${props.match.params.purchaseOrderID}`,
                        { newStatus: PO_STATES.RECEIVED }
                    ).then(res => {
                        if (res.status === 200) {
                            setProceedNextStatusLoading(false);
                            message.success('Successfully moved purchase order to next status!');
                            history.push(CONFIG.WAREHOUSE_PURCHASE_ORDER_URL);
                        }
                    }).catch(err => {
                        setProceedNextStatusLoading(false);
                        redirectToErrorPage(err, history);
                    })
            },
            okText: 'Confirm'
        })
    }

    return (
        <> 
            <BilboPageHeader
                title='Purchase Order Details'
                onBack={() => history.push(CONFIG.WAREHOUSE_PURCHASE_ORDER_URL)}
            />

            <Spin spinning={isLoadingPurchaseOrderDetails}>
                <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
                <p>When Purchase Order shipment has been received, click on the 'Confirm and Proceed' button.</p>
                <CollapsiblePurchaseOrderDataDisplay 
                    purchaseOrderMetaData={purchaseOrderMetaData} 
                    purchaseOrderStateData={purchaseOrderStateData} 
                />
                
                <BilboDivider />
                <Row justify='end'>
                    <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                        <Button style={{width: '100%'}} type="primary" 
                                loading={proceedNextStatusLoading} 
                                onClick={proceedNextStatus}
                        >
                            Confirm and Proceed
                        </Button>
                    </Space>
                </Row>
            </Spin>
        </>
    )
}
