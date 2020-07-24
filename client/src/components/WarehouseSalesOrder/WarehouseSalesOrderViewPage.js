import React, {useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText,
         BilboPageHeader,
         BilboDivider } from '../UtilComponents';
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Spin, Row, Space, Button, message, Modal } from 'antd';
const { confirm } = Modal;
import { bax, redirectToErrorPage } from '../../context/AuthContext';
import { SO_STATES } from '../../../../server/data/databaseEnum';
import CONFIG from '../../config';
import CollapsibleSalesOrderDataDisplay from '../SalesOrder/SalesOrderViewPage/CollapsibleSalesOrderDataDisplay';

/**
 * React Component to render sales order details
 * for a warehouse user. Has a `Confirm and Proceed`
 * button that is to be used when the sales order
 * has been packed and sent for delivery to customer. 
 */
export default function WarehouseSalesOrderViewPage(props) {
    const history = useHistory();
    const [salesOrderMetaData, setSalesOrderMetaData] = useState({});
    const [salesOrderStateData, setSalesOrderStateData] = useState({});
    const [isLoadingSalesOrderDetails, setIsLoadingSalesOrderDetails] = useState(true);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);

    useEffect(() => {
        (async function() {
            // Get Meta-Data and State Data
            await bax.get(`/api/v1/warehouse/salesOrder/${props.match.params.salesOrderID}`)
                .then(res => {
                    if (res.status === 200) {
                        // Transform partNumber to include supplier name
                        res.data.state.parts.map(partInfo => {
                            partInfo.partNumber = `${partInfo.part.partNumber} (${partInfo.part.supplier.name})`
                            partInfo.latestPrice = partInfo.part.priceHistory[partInfo.part.priceHistory.length - 1].unitPrice;
                        })
                        setSalesOrderStateData(res.data.state);
                        const metaData = JSON.parse(JSON.stringify(res.data));
                        delete metaData.state;
                        setSalesOrderMetaData(metaData);
                        setIsLoadingSalesOrderDetails(false);
                    }
                }).catch(err => {
                    setIsLoadingSalesOrderDetails(false);
                    redirectToErrorPage(err, history);
                })
        })();
    }, []) // Run only once (on component mounting)

    // Handler when `Confirm and Proceed` button is clicked on
    const proceedNextStatus = () => {
        confirm({
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you wish to move this sales order to the next status? This is NOT reversible.',
            onOk: () => {
                setProceedNextStatusLoading(true);
                bax.patch(`/api/v1/warehouse/salesOrder/${props.match.params.salesOrderID}`,
                        { newStatus: SO_STATES.IN_DELIVERY }
                    ).then(res => {
                        if (res.status === 200) {
                            setProceedNextStatusLoading(false);
                            message.success('Successfully moved sales order to next status!');
                            history.push(CONFIG.WAREHOUSE_SALES_ORDER_URL);
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
                title='Sales Order Details'
                onBack={() => history.push(CONFIG.WAREHOUSE_SALES_ORDER_URL)}
            />

            <Spin spinning={isLoadingSalesOrderDetails}>
                <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
                <p>When Sales Order has been packed and sent for delivery, click on the 'Confirm and Proceed' button.</p>
                <CollapsibleSalesOrderDataDisplay 
                    salesOrderMetaData={salesOrderMetaData} 
                    salesOrderStateData={salesOrderStateData} 
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
