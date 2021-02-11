import React  from 'react';
import { DarkInvertedStyledButton } from '../../../UtilComponents';
import { Row, Tag, Form, Input, InputNumber } from 'antd';
import PropTypes from 'prop-types';

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
                            style={{width: '15%', marginRight: '5px'}}
                            rules={[{ required: true, message: 'Missing partNumber' }]}
                        >
                            <Input disabled={true}></Input>
                        </Form.Item>
                        <Form.Item
                            {...field}
                            name={[field.name, 'partName']}
                            fieldKey={[field.fieldKey, 'partName']}
                            key={`${field.fieldKey}-partName`}
                            style={{width: '15%', marginRight: '5px'}}
                            rules={[{ required: true, message: 'Missing partName' }]}
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
                            style={{width: '10%', marginRight: '5px'}}
                            name={[field.name, 'latestPrice']}
                            fieldKey={[field.fieldKey, 'latestPrice']}
                            key={`${field.fieldKey}-latestPrice`}
                            rules={[{ required: true, message: 'Missing selling price' }]}
                        >
                            <InputNumber disabled={true} placeholder="Quantity" style={{ width: '100%' }}/>
                        </Form.Item>
                        <Form.Item
                            {...field}
                            style={{width: '25%', marginRight: '5px'}}
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
                                    <Tag color='cyan'
                                         style={{display: 'block'}} 
                                         key={`${field.fieldKey}-${index}`}>
                                        {`${fulfilledByTarget.purchaseOrderNumber}: ${fulfilledByTarget.quantity}`}
                                    </Tag>
                                )
                            })}
                        </div>

                        <DarkInvertedStyledButton
                            style={{position: 'absolute', right: '0%'}}
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