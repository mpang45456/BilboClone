import React, { useState } from 'react';
import { BilboHoverableIconButton } from '../../../UtilComponents';
import { Select, Row, Spin, Form, Input, Button, InputNumber } from 'antd';
const { Option } = Select;
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import debounce from 'lodash/debounce';
import queryString from 'query-string';
import { theme } from '../../../Theme';

/**
 * Dynamic Form Section for new (yet-to-be-added) parts.
 * Allows users to dynamically add parts. 
 */
export default function NewPartsFormSection(props) {
    /* 
    Keeps track of the searches (for part number) for each
    dynamically added field. Only `partNumber` can be searched
    for (`quantity` and `additionalInfo` cannot). It has the form:
        [
            {
                partsData: [],
                isGettingPartData: bool,
            }
        ]
    */
    const [partSearches, setPartSearches] = useState([]);

    // Function for retrieving parts that fit search description
    let lastFetchID = 0;
    const getPartData = debounce((searchValue, index) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;

        const updatedPartSelections = [...partSearches];
        let filter = JSON.stringify({
            "partNumber": { "$regex": searchValue, "$options": "i"},
        })
        let query = queryString.stringify({inc: 'partNumber', supplierPopulate: 'name', filter})
        bax.get(`/api/v1/part?${query}`, { withCredentials: true })
            .then(res => {
                // Ensure correct order of callback
                // Obsolete (slow) responses would have 
                // a smaller `thisFetchID` and are discarded
                // Note: `thisFetchID` is a local block variable,
                // but `lastFetchID` is a variable local to
                // the entire React component (it keeps incrementing)
                if (thisFetchID === lastFetchID) {
                    updatedPartSelections[index].partsData = res.data.parts;
                    updatedPartSelections[index].isGettingPartData = false;
                    setPartSearches(updatedPartSelections);
                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, CONFIG.DEBOUNCE_LIMIT)

    return (
        <Form.List name="partsNew">
        {(fields, { add, remove }) => {
            return (
            <div>
                {fields.map((field, index) => (
                <Row key={field.key} style={{ width: '100%' }} >
                    <Form.Item
                        {...field}
                        name={[field.name, 'part']}
                        fieldKey={[field.fieldKey, 'part']}
                        key={`${field.fieldKey}-part`}
                        style={{width: '20%', marginRight: '5px'}}
                        rules={[{ required: true, message: 'Missing part' }]}
                    >
                        <Select placeholder='Select Part Number'
                                notFoundContent={partSearches[index].isGettingPartData ? <Spin size='small'/>: null}
                                filterOption={false}
                                showSearch={true}
                                onSearch={(searchValue) => getPartData(searchValue, index)} >
                            {
                                partSearches[index].partsData.map(partData => {
                                    return (
                                        <Option key={partData._id}
                                                value={partData._id} >
                                            {`${partData.partNumber} (${partData.supplier.name})`}
                                        </Option>
                                    )
                                })
                            }
                        </Select>
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
                </Row>
                ))}

                <Form.Item>
                <Button
                    type="dashed"
                    onClick={() => {
                    const updatedPartSelections = [...partSearches];
                    updatedPartSelections.push({
                        isGettingPartData: false,
                        partsData: [],
                    })
                    setPartSearches(updatedPartSelections);
                    add();
                    }}
                >
                    <PlusOutlined /> Add Another Part
                </Button>
                </Form.Item>
            </div>
            );
        }}
        </Form.List>
    )
}