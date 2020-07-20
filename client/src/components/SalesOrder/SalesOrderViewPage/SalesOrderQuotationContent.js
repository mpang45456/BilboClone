import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboDisplayOnlySteps,
         BilboHoverableIconButton,
         BilboNavLink } from '../../UtilComponents';
import { Menu, Select, Modal, Row, Col, Table, Steps, Popover, Spin, message, Form, Input, Button, Space } from 'antd';
const { confirm } = Modal;
const { Option, OptGroup } = Select;
const { Step } = Steps;
import { PlusOutlined, MinusCircleOutlined, StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { SO_STATES } from '../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../utils';
import debounce from 'lodash/debounce';
import queryString from 'query-string';
import { theme } from '../../Theme';
import { isEmpty } from 'lodash';


// TODO: Update docs
// This component is only rendered by `SalesOrderViewPage`
// if salesOrderMetaData and salesOrderStateData are available
// so there is no need to handle the case when the API call has 
// not returned 
export default function SalesOrderQuotationContent(props) {
    const onFinish = (values) => {
        // TODO: TO BE IMPLEMENTED
        console.log(values);
    }
    console.log(props.salesOrderStateData);
    // TODO: Check <Space /> key={field.key}
    // TODO: Convert quantity to number
    // TODO: Allow selection for part number
    // TODO: Check for duplicate part number
    // TODO: Resolve opt group issue for parts with same supplier but same search term
    // TODO: Resolve indexing (of partSearches) after the addition of the partsExisting section of the form
    const [partSearches, setPartSearches] = useState(
        props.salesOrderStateData.parts.map(_ => {
            return {isGettingPartData: false, partsData: []};
        })
    )

    const debounceLimit = 300; // in ms // TODO: Refactor into CONFIG?
    let lastFetchID = 0;
    const getPartData = debounce((searchValue, index) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;

        const updatedPartSelections = [...partSearches];
        // updatedPartSelections[index].partsData = [];
        // updatedPartSelections[index].isGettingPartData = true;
        // setPartSearches(updatedPartSelections);

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
    }, debounceLimit)

    return (
        <Form name="quotationStatusForm" 
                onFinish={onFinish}
                initialValues={{
                    partsExisting: props.salesOrderStateData.parts
                }}
                autoComplete="off"
                >
            {/* Form Section for Existing Parts (in `props.salesOrderStateData.parts`) */}
            <Form.List name="partsExisting">
            {(fields, { add, remove }) => {
                return (
                <div>
                    {fields.map((field, index) => (
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
                            style={{width: '15%', marginRight: '5px'}}
                            name={[field.name, 'quantity']}
                            fieldKey={[field.fieldKey, 'quantity']}
                            key={`${field.fieldKey}-quantity`}
                            rules={[{ required: true, message: 'Missing quantity' }]}
                        >
                            <Input placeholder="Quantity" />
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
                            onClick={() => {
                            // TODO: Need to remove from partSearches
                            const updatedPartSelections = [...partSearches];
                            updatedPartSelections.splice(index, 1);
                            setPartSearches(updatedPartSelections);
                            remove(field.name);
                            }} >
                            <MinusCircleOutlined />
                        </BilboHoverableIconButton>
                        
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

            {/* Form Section for New (Yet-To-Be-Added) Parts */}
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
                            <Input placeholder="Quantity" />
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
                            onClick={() => {
                            // TODO: Need to remove from partSearches
                            const updatedPartSelections = [...partSearches];
                            updatedPartSelections.splice(index, 1);
                            setPartSearches(updatedPartSelections);
                            remove(field.name);
                            }} >
                            <MinusCircleOutlined />
                        </BilboHoverableIconButton>
                    </Row>
                    ))}
    
                    <Form.Item>
                    <Button
                        type="dashed"
                        onClick={() => {
                        // TODO: Need to add to partSearches
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
    
            <Form.Item>
            <Button type="primary" htmlType="submit">
                Submit
            </Button>
            </Form.Item>
        </Form>
    )
}
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}