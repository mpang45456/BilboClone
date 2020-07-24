import React from 'react';
import { Collapse } from 'antd';
const { Panel } = Collapse;
import PropTypes from 'prop-types';
import { OrderSummarySection } from '../../UtilComponents';
import PurchaseOrderMetaDataDisplaySection from './PurchaseOrderMetaDataDisplaySection';
import PurchaseOrderStateDataDisplaySection from './PurchaseOrderStateDataDisplaySection';

/**
 * React Component with a Collapsible Panel
 * displaying Purchase Order Meta and State Data.
 */
export default function CollapsiblePurchaseOrderDataDisplay(props) {
    return (
        <>
            <Collapse>
                <Panel header='Purchase Order Details'>
                    <PurchaseOrderMetaDataDisplaySection 
                        purchaseOrderMetaData={props.purchaseOrderMetaData} 
                    />

                    <PurchaseOrderStateDataDisplaySection
                        purchaseOrderStateData={props.purchaseOrderStateData} 
                    />

                    <OrderSummarySection 
                        orderStateData={props.purchaseOrderStateData}
                    />
                </Panel>
            </Collapse>
        </>
    )
}
CollapsiblePurchaseOrderDataDisplay.propTypes = {
    purchaseOrderMetaData: PropTypes.object.isRequired,
}
