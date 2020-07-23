import React from 'react';
import { BilboDividerWithText, 
         BilboDescriptions } from '../../UtilComponents';
import { Descriptions, Input, Row, Tag, InputNumber } from 'antd';
import PropTypes from 'prop-types';

/**
 * React Component to display the Purchase Order
 * State Data. There is nothing interactive about
 * this component.
 */
export default function PurchaseOrderStateDataDisplaySection(props) {
    return (
        <>
            <BilboDividerWithText orientation='left'>Administrative Details</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Additional Information">
                    <Input.TextArea value={props.purchaseOrderStateData.additionalInfo}
                                    readOnly={true}/>
                </Descriptions.Item>
            </BilboDescriptions>
            
            <BilboDividerWithText orientation='left'>Part Details</BilboDividerWithText>
            {
                props.purchaseOrderStateData.parts.map((partInfo, index) => {
                    return (
                        <div key={index}>
                            <Row style={{width: '100%'}}>
                                <Input disabled={true} value={partInfo.partNumber} style={{width: '30%', marginRight: '5px'}}/>
                                <InputNumber disabled={true} value={partInfo.quantity} style={{width: '10%', marginRight: '5px'}}/>
                                <Input.TextArea disabled={true} rows={1} value={partInfo.additionalInfo} style={{width: '40%', marginRight: '5px'}}/>
                                <div>
                                    {partInfo.fulfilledFor.map((fulfilledForTarget, innerIndex) => {
                                        return (
                                            <Tag color='cyan'
                                                style={{display: 'block'}} 
                                                key={`tag-${innerIndex}`}>
                                                {`${fulfilledForTarget.salesOrder.orderNumber}: ${fulfilledForTarget.quantity}`}
                                            </Tag>
                                        )
                                    })}
                                </div>
                            </Row>
                        </div>
                    )
                })
            }
        </>
    )
}
PurchaseOrderStateDataDisplaySection.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
}