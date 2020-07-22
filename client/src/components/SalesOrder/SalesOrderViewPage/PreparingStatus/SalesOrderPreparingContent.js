import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, BilboDivider } from '../../../UtilComponents';
import { Row, Button, Space } from 'antd';
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import CollapsibleSalesOrderDataDisplay from '../CollapsibleSalesOrderDataDisplay';
import { setSalesOrderToNextStatus } from '../../../../utils';
// TODO: Clean Up Import Statements

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.PREPARING` status.
 * 
 * Note: Only warehouse users will be able to progress
 * the sales order to the next status (`SO_STATES.IN_DELIVERY`).
 * Hence, this component is relatively 'dumb', and simply
 * displays text and the current sales order data.
 */
export default function SalesOrderPreparingContent(props) {
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const history = useHistory();

    return (
        <> 
            <BilboDividerWithText orientation='left'>Information</BilboDividerWithText>
            <p>Sales Order is currently being prepared. Warehouse will change Sales Order status once order has been shipped for delivery</p>
            <CollapsibleSalesOrderDataDisplay 
                salesOrderMetaData={props.salesOrderMetaData} 
                salesOrderStateData={props.salesOrderStateData} 
            />

            {/* TODO: Marked for removal (not supposed to be accessible by sales user) */}
            <BilboDivider />
            <Row justify='end'>
                <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                    <Button style={{width: '100%'}} type="primary" 
                            loading={proceedNextStatusLoading} 
                            onClick={() => {setSalesOrderToNextStatus(SO_STATES.IN_DELIVERY,
                                                                      props.salesOrderStateData,
                                                                      props.salesOrderMetaData,
                                                                      history,
                                                                      setProceedNextStatusLoading
                                                                    )}}
                    >
                        Confirm and Proceed
                    </Button>
                </Space>
            </Row>
        </>
    )
}
SalesOrderPreparingContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}