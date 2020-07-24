import React from 'react';
import { BilboHoverableIconButton } from '../../../UtilComponents';
import { Row, Form, Input, InputNumber } from 'antd';
import { MinusCircleOutlined } from "@ant-design/icons";
import { theme } from '../../../Theme';

/**
 * Form Section for existing parts (parts are in 
 * `salesOrderStateData.parts`). 
 * 
 * Note: The part number cannot be edited for existing
 * parts, but quantity and additional info can. If the
 * user wishes to edit the part number, simply delete
 * the part and add a new one.
 * 
 * Note: the `salesOrderStateData` is NOT passed down
 * to this component as a prop. Instead, it is populated
 * via the `initialValues` field in the parent `<Form/>
 * component
 * 
 * Note: The <Form.Item/> for `_id` is hidden. This
 * is because the <Form.Item/> for `partNumber` displays
 * the part number (for ease of understanding in the UI)
 * but the `partObjID` is necessary for the API call
 * during form submission. Hence, the <Form.Item/> for
 * `_id` is in the form, but hidden from the user, 
 * ensuring that `partObjID` is available during form
 * submission.
 */
export default function ExistingPartsFormSection(props) {
    return (
        <Form.List name="partsExisting">
        {(fields, { add, remove }) => {
            return (
            <div>
                {fields.map((field, index) => (
                <Row key={field.key} style={{ width: '100%' }} >
                    {/* Displays part number, but actually need partObjID during API call */}
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
                        style={{width: '15%', marginRight: '5px'}}
                        name={[field.name, 'quantity']}
                        fieldKey={[field.fieldKey, 'quantity']}
                        key={`${field.fieldKey}-quantity`}
                        rules={[{ required: true, message: 'Missing quantity' }]}
                    >
                        <InputNumber placeholder="Quantity" style={{ width: '100%' }}/>
                    </Form.Item>
                    <Form.Item
                        {...field}
                        style={{width: '55%', marginRight: '5px'}}
                        name={[field.name, 'additionalInfo']}
                        fieldKey={[field.fieldKey, 'additionalInfo']}
                        key={`${field.fieldKey}-additionalInfo`}
                    >
                        <Input.TextArea placeholder="Additional Information" 
                                        rows={1}
                        />
                    </Form.Item>
    
                    <BilboHoverableIconButton
                        style={{fontSize: '15px'}}
                        shape='circle'
                        transformcolor={theme.colors.brightRed}
                        onClick={() => { remove(field.name); }} >
                        <MinusCircleOutlined />
                    </BilboHoverableIconButton>
                    
                    {/* Ensures that form will have partObjID during submission */}
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