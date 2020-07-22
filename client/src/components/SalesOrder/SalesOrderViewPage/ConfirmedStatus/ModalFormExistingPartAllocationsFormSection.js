import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboHoverableIconButton,
         DarkInvertedStyledButton,
         BilboDivider } from '../../../UtilComponents';
import { Space, Modal, Row, message, Select, Tag, Form, Button, Input, InputNumber } from 'antd';
const { confirm } = Modal;
const { Option } = Select;
import { ExclamationCircleOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import { theme } from '../../../Theme';
import { debounce } from 'lodash';
import queryString from 'query-string';

/**
 * Displays the existing parts allocation in
 * <ModalForm/>. 
 * 
 * Note: There is a <Form.Item/> for `_id`
 * which contains the purchaseOrderObjID but
 * is not displayed for the user. This is because
 * the purchaseOrderObjID is necessary during the API
 * call during form submission (not by <ModalForm/>,
 * but by the <Form/> in <SalesOrderConfirmedContent/>),
 * but is unsightly in the UI. Instead, the purchase
 * order number is displayed instead. 
 * 
 * Note: For existing part allocations, all the inputs
 * are disabled. A user can only delete the existing part 
 * allocation. If the quantity/purchase order needs to be
 * changed, simply delete the old allocation and make a new
 * one.
 */
export default function ModalFormExistingPartAllocationsFormSection(props) {
    return (
        <Form.List name="partsAllocationExisting">
            {(fields, { add, remove }) => {
                return (
                <div>
                    {fields.map((field, index) => (
                    <Row key={field.key} style={{ width: '100%' }} >
                        {/* Displays purchase order number, but actually need purchaseOrderObjID during API call */}
                        <Form.Item
                            {...field}
                            name={[field.name, 'purchaseOrderNumber']}
                            fieldKey={[field.fieldKey, 'purchaseOrderNumber']}
                            key={`${field.fieldKey}-purchaseOrderNumber`}
                            style={{width: '55%', marginRight: '5px'}}
                            rules={[{ required: true, message: 'Missing Purchase Order Number' }]}
                        >
                            <Input disabled={true}></Input>
                        </Form.Item>
                        <Form.Item
                            {...field}
                            style={{width: '30%', marginRight: '5px'}}
                            name={[field.name, 'quantity']}
                            fieldKey={[field.fieldKey, 'quantity']}
                            key={`${field.fieldKey}-quantity`}
                            rules={[{ required: true, message: 'Missing quantity' }]}
                        >
                            <InputNumber disabled={true} placeholder="Quantity" style={{ width: '100%' }}/>
                        </Form.Item>
        
                        <BilboHoverableIconButton
                            style={{fontSize: '15px'}}
                            shape='circle'
                            transformcolor={theme.colors.brightRed}
                            onClick={() => { remove(field.name); }} >
                            <MinusCircleOutlined />
                        </BilboHoverableIconButton>
                        
                        {/* Ensures that form will have purchaseOrderObjID during submission */}
                        <Form.Item
                            {...field}
                            name={[field.name, '_id']}
                            fieldKey={[field.fieldKey, '_id']}
                            key={`${field.fieldKey}-part`}
                        >
                            <Input style={{ display: 'none'}} />
                        </Form.Item>
                    </Row>
                    ))}
                </div>
                );
            }}
        </Form.List>
    )
}