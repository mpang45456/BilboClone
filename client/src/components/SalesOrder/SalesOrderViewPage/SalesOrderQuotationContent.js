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
export default function SalesOrderQuotationContent(props) {
    // TODO: Populate the pre-existing parts
    /*
    salesOrderState: {
        status
        additionalInfo
        parts: []
        updatedBy:
    }
     */
    // parts: [{part: '123', quantity: 123, additionalInfo: 'asd'}]
    /*
[{ additionalInfo: "Blue in color",
                            fulfilledBy: [],
                            part: "5f14f720e23ddf3bb629630d",
                            quantity: 1000,
                            _id: "5f14f720e23ddf3bb6296421" }]
    */
    console.log(props.salesOrderStateData.parts)
    const onFinish = (values) => {
        // TODO: TO BE IMPLEMENTED
        console.log(values);
    }
    // TODO: Check <Space /> key={field.key}
    // TODO: Convert quantity to number
    // TODO: Allow selection for part number
    const [partSelections, setPartSelections] = useState([
        {
            isGettingPartData: false,
            partsData: [],
        },
        {
            isGettingPartData: false,
            partsData: [],
        },
    ])

    const debounceLimit = 300; // in ms // TODO: Refactor into CONFIG?
    let lastFetchID = 0;
    const getPartData = debounce((searchValue, index) => {
        console.log(partSelections);
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;

        const updatedPartSelections = [...partSelections];
        // updatedPartSelections[index].partsData = [];
        // updatedPartSelections[index].isGettingPartData = true;
        // setPartSelections(updatedPartSelections);

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
                    setPartSelections(updatedPartSelections);
                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, debounceLimit)

    if (isEmpty(props.salesOrderMetaData) || isEmpty(props.salesOrderStateData)) {
        return (
            <div>
                <Spin />
            </div>
        )
    } else {
        return (
            <Form name="quotationStatusForm" 
                  onFinish={onFinish}
                  initialValues={{
                      parts: props.salesOrderStateData.parts
                  }}
                  autoComplete="off"
                  >
              <Form.List name="parts">
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
                                        notFoundContent={partSelections[index].isGettingPartData ? <Spin size='small'/>: null}
                                        filterOption={false}
                                        showSearch={true}
                                        onSearch={(searchValue) => getPartData(searchValue, index)} >
                                    {
                                        partSelections[index].partsData.map(partData => {
                                            return (
                                                <OptGroup key={partData.supplier._id}
                                                          label={partData.supplier.name}>
                                                    <Option key={partData._id}
                                                            value={partData._id} >
                                                        {partData.partNumber}
                                                    </Option>
                                                </OptGroup>
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
                                // TODO: Need to remove from partSelections
                                const updatedPartSelections = [...partSelections];
                                updatedPartSelections.splice(index, 1);
                                setPartSelections(updatedPartSelections);
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
                            // TODO: Need to add to partSelections
                            const updatedPartSelections = [...partSelections];
                            updatedPartSelections.push({
                                isGettingPartData: false,
                                partsData: [],
                            })
                            setPartSelections(updatedPartSelections);
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
}
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}