import React from 'react';
import { BilboDividerWithText, 
         BilboDescriptions } from '../../UtilComponents';
import { Descriptions } from 'antd';
import PropTypes from 'prop-types';

/**
 * React Component to display the purchase order
 * meta data. 
 */
export default function PurchaseOrderMetaDataDisplaySection(props) {
    return(
        <>
            <BilboDividerWithText orientation='left'>Purchase Order Information</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Order Number">
                    {props.purchaseOrderMetaData.orderNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Owner" >
                    {props.purchaseOrderMetaData.createdBy}
                </Descriptions.Item>
                <Descriptions.Item label="Supplier" >
                    {props.purchaseOrderMetaData.supplier.name}
                </Descriptions.Item>
                <Descriptions.Item label="Overview Information" >
                    {props.purchaseOrderMetaData.additionalInfo}
                </Descriptions.Item>
            </BilboDescriptions>
        </>
    )
}
PurchaseOrderMetaDataDisplaySection.propTypes = {
    purchaseOrderMetaData: PropTypes.object.isRequired,
}