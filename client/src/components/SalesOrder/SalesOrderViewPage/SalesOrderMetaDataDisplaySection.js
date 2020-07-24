import React from 'react';
import { BilboDividerWithText, 
         BilboDescriptions } from '../../UtilComponents';
import { Descriptions } from 'antd';
import PropTypes from 'prop-types';

/**
 * React Component to display the sales order
 * meta data. 
 */
export default function SalesOrderMetaDataDisplaySection(props) {
    return(
        <>
            <BilboDividerWithText orientation='left'>Sales Order Information</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Order Number">
                    {props.salesOrderMetaData.orderNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Owner" >
                    {props.salesOrderMetaData.createdBy}
                </Descriptions.Item>
                <Descriptions.Item label="Customer" >
                    {props.salesOrderMetaData.customer.name}
                </Descriptions.Item>
                <Descriptions.Item label="Overview Information" >
                    {props.salesOrderMetaData.additionalInfo}
                </Descriptions.Item>
            </BilboDescriptions>
        </>
    )
}
SalesOrderMetaDataDisplaySection.propTypes = {
    salesOrderMetaData: PropTypes.object.isRequired,
}