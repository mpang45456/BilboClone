import React, { useState } from 'react';
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
 * React Component to render content for Sales Orders
 * that have `SO_STATES.QUOTATION` status.
 * // TODO: Update docs
 * 
 * Management of state for fulfilledBy is in a separate
 * react state
 */
export default function SalesOrderConfirmedContent(props) {
    const [form] = Form.useForm();
    const [partsFulfilledBy, setPartsFulfilledBy] = useState(
        props.salesOrderStateData.parts.map(partInfo => {
            return partInfo.fulfilledBy;
        })
    )

    const [modalSelectedPurchaseOrderIndex, setSelectedModalPurchaseOrderIndex] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const allocatePart = (index) => {
        setSelectedModalPurchaseOrderIndex(index);
        setIsModalVisible(true);
    }

    const closeModal = () => {
        setIsModalVisible(false);
    }

    return (
        <>
            <Form name='confirmedStatusForm'
                  form={form}
                  initialValues={{
                      parts: props.salesOrderStateData.parts
                  }}
                  autoComplete='off'
                  >
                <Form.List name='parts'>
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
                                    {form.getFieldValue(['parts', field.fieldKey, 'fulfilledBy']).map((fulfilledByTarget, index) => {
                                        return (
                                            <Tag style={{display: 'block'}} 
                                                 key={`${field.fieldKey}-${index}`}>
                                                {`${fulfilledByTarget.purchaseOrder}: ${fulfilledByTarget.quantity}`}
                                            </Tag>
                                        )
                                    })}
                                </div>

                                <DarkInvertedStyledButton
                                    onClick={() => {allocatePart(field.fieldKey)}}>
                                    Allocate
                                </DarkInvertedStyledButton>
                
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
            </Form>

            <ModalForm visible={isModalVisible}
                       salesOrderStateData={props.salesOrderStateData}
                       modalSelectedPurchaseOrderIndex={modalSelectedPurchaseOrderIndex}
                       closeModal={closeModal}
                       parentForm={form}
            />
        </>
    )
}
SalesOrderConfirmedContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}

// TODO: Perform checks that PO is allowed for allocation (sufficient parts, has the part etc.)
// TODO: Pass parent form down to setFieldValue for the 
function ModalForm(props) {
    const [form] = Form.useForm();

    let existingAllocation = props.salesOrderStateData.parts[props.modalSelectedPurchaseOrderIndex].fulfilledBy;
    console.log(`Existing Allocation: ${props.modalSelectedPurchaseOrderIndex} ${JSON.stringify(existingAllocation, null, 2)}`);

    const [purchaseOrderSearches, setPurchaseOrderSearches] = useState(
        existingAllocation.map(_ => {
            return {
                purchaseOrderData: [],
                isGettingPurchaseOrderData: false,
            }
        })
    )

    // Function for retrieving purchase orders that fit search description
    let lastFetchID = 0;
    const getPurchaseOrderData = debounce((searchValue, index) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;

        const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
        let filter = JSON.stringify({
            "orderNumber": { "$regex": searchValue, "$options": "i"},
        })
        let query = queryString.stringify({inc: 'orderNumber', filter})
        bax.get(`/api/v1/purchaseOrder?${query}`, { withCredentials: true })
            .then(res => {
                // Ensure correct order of callback
                // Obsolete (slow) responses would have 
                // a smaller `thisFetchID` and are discarded
                // Note: `thisFetchID` is a local block variable,
                // but `lastFetchID` is a variable local to
                // the entire React component (it keeps incrementing)
                if (thisFetchID === lastFetchID) {
                    updatedPurchaseOrderSearches[index].purchaseOrderData = res.data.purchaseOrders;
                    updatedPurchaseOrderSearches[index].isGettingPurchaseOrderData = false;

                    // TODO: Perform additional checks --> no duplicates, available for allocation
                    setPurchaseOrderSearches(updatedPurchaseOrderSearches);
                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, CONFIG.DEBOUNCE_LIMIT);

    const onModalOk = () => {
        let updatedParts = props.parentForm.getFieldValue('parts');
        updatedParts[props.modalSelectedPurchaseOrderIndex].fulfilledBy = form.getFieldsValue().partsAllocation;
        props.parentForm.setFieldsValue({parts: updatedParts});

        // Perform validation
        console.log(form.getFieldsValue());
        form.resetFields();
        props.closeModal();
    }

    const onModalCancel = () => {
        form.resetFields();
        props.closeModal();
    }

    return(
        <>
            <Modal visible={props.visible} 
                   onOk={onModalOk}
                   onCancel={props.closeModal}
                   >
                <Form name='modalPartAllocationForm'
                      initialValues={{
                          partsAllocation: existingAllocation
                      }}
                      form={form}>
                    <Form.List name="partsAllocation">
                    {(fields, { add, remove }) => {
                        return (
                        <div>
                            {fields.map((field, index) => (
                            <Row key={field.key} style={{ width: '100%' }} >
                                <Form.Item
                                    {...field}
                                    name={[field.name, 'purchaseOrder']}
                                    fieldKey={[field.fieldKey, 'purchaseOrder']}
                                    key={`${field.fieldKey}-purchaseOrder`}
                                    style={{width: '20%', marginRight: '5px'}}
                                    rules={[{ required: true, message: 'Missing purchase order' }]}
                                >
                                    <Select placeholder='Select Purchase Order'
                                            notFoundContent={purchaseOrderSearches[index].isGettingPurchaseOrderData ? <Spin size='small'/>: null}
                                            filterOption={false}
                                            showSearch={true}
                                            onSearch={(searchValue) => getPurchaseOrderData(searchValue, index)} >
                                        {
                                            purchaseOrderSearches[index].purchaseOrderData.map(purchaseOrderInfo => {
                                                return (
                                                    <Option key={purchaseOrderInfo._id}
                                                            value={purchaseOrderInfo._id} >
                                                        {`${purchaseOrderInfo._id}`}
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
                
                                <BilboHoverableIconButton
                                    style={{fontSize: '15px'}}
                                    shape='circle'
                                    transformcolor={theme.colors.brightRed}
                                    onClick={() => { 
                                        // TODO: Remove from purchaseOrderSearches
                                        const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                                        updatedPurchaseOrderSearches.splice(field.name, 1);
                                        setPurchaseOrderSearches(updatedPurchaseOrderSearches);
                                        remove(field.fieldKey); 
                                    }} >
                                    <MinusCircleOutlined />
                                </BilboHoverableIconButton>
                            </Row>
                            ))}

                            <Form.Item>
                            <Button
                                type="dashed"
                                onClick={() => {
                                const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                                updatedPurchaseOrderSearches.push({
                                    isGettingPurchaseOrderData: false,
                                    purchaseOrderData: [],
                                })
                                setPurchaseOrderSearches(updatedPurchaseOrderSearches);
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
                </Form>
            </Modal>
        </>
    )
}
ModalForm.propTypes = {
    visible: PropTypes.bool.isRequired,
    modalSelectedPurchaseOrderIndex: PropTypes.number.isRequired,
    salesOrderStateData: PropTypes.object.isRequired,
    closeModal: PropTypes.func.isRequired,
    parentForm: PropTypes.object.isRequired,
}