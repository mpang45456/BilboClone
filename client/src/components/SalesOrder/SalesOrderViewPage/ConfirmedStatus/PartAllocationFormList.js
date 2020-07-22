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

export default function PartAllocationFormList(props) {
    return (
        <Form.List name='parts'>
            {(fields) => {
                return (
                <div>
                    {fields.map((field) => (
                    <Row key={field.key} style={{ width: '100%' }} >
                        <Form.Item
                            {...field}
                            name={[field.name, 'partNumber']}
                            fieldKey={[field.fieldKey, 'partNumber']}
                            key={`${field.fieldKey}-partNumber`}
                            style={{width: '20%', marginRight: '5px'}}
                            rules={[{ required: true, message: 'Missing partNumber' }]}
                        >
                            <Input disabled={true}></Input>
                        </Form.Item>
                        <Form.Item
                            {...field}
                            style={{width: '10%', marginRight: '5px'}}
                            name={[field.name, 'quantity']}
                            fieldKey={[field.fieldKey, 'quantity']}
                            key={`${field.fieldKey}-quantity`}
                            rules={[{ required: true, message: 'Missing quantity' }]}
                        >
                            <InputNumber disabled={true} placeholder="Quantity" style={{ width: '100%' }}/>
                        </Form.Item>
                        <Form.Item
                            {...field}
                            style={{width: '30%', marginRight: '5px'}}
                            name={[field.name, 'additionalInfo']}
                            fieldKey={[field.fieldKey, 'additionalInfo']}
                            key={`${field.fieldKey}-additionalInfo`}
                        >
                            <Input.TextArea placeholder="Additional Information" 
                                            rows={1}
                                            disabled={true} 
                            />
                        </Form.Item>
                        
                        <div>
                            {props.form.getFieldValue(['parts', field.fieldKey, 'fulfilledBy']).map((fulfilledByTarget, index) => {
                                return (
                                    <Tag style={{display: 'block'}} 
                                            key={`${field.fieldKey}-${index}`}>
                                        {`${fulfilledByTarget.purchaseOrderNumber}: ${fulfilledByTarget.quantity}`}
                                    </Tag>
                                )
                            })}
                        </div>

                        <DarkInvertedStyledButton
                            onClick={() => {props.onAllocateButtonClick(field.fieldKey)}}>
                            Allocate
                        </DarkInvertedStyledButton>
        
                        <Form.Item
                            {...field}
                            name={[field.name, 'part']}
                            fieldKey={[field.fieldKey, 'part']}
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
PartAllocationFormList.propTypes = {
    onAllocateButtonClick: PropTypes.func.isRequired,
    form: PropTypes.object.isRequired,
}