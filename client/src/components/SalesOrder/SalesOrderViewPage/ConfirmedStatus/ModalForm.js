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






// TODO: Perform checks that PO is allowed for allocation (sufficient parts, has the part etc.)
// TODO: Update docs: Mount a new ModalForm everytime modal is made visible

// Allows you to add allocations to multiple purchase orders
export default function ModalForm(props) {
    const [form] = Form.useForm();
    /* Stores the search results for each purchase order number search bar
       Has format: 
       {
            isGettingPurchaseOrderData: bool, 
            purchaseOrderData: []
            min: Number
            max: Number
       }
    */
    const [purchaseOrderSearches, setPurchaseOrderSearches] = useState([]);
    let existingAllocation = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].fulfilledBy;

    // Function for retrieving Purchase Orders that fit search description
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
        form.validateFields()
            .then(_ => {

            }).catch(_ => {
                // Do nothing. UI displays error message.
            })

        // // TODO: Perform processing to get the data into the accepted format in parent form
        // // TODO: Update docs: Update Parent Form values directly
        // let updatedParts = props.parentForm.getFieldValue('parts');
        // // Existing Parts Allocation
        // updatedParts[props.modalSelectedPartIndex].fulfilledBy = form.getFieldsValue().partsAllocationExisting;
        // // New Parts Allocation
        // if (form.getFieldsValue().partsAllocationNew) {
        //     form.getFieldsValue().partsAllocationNew.map(partAllocation => {
        //         // TODO: Might not need the || divider any more
        //         const purchaseOrderObjID = partAllocation.purchaseOrderNumber.split('||')[0];
        //         const purchaseOrderNumber = partAllocation.purchaseOrderNumber.split('||')[1]; // TODO: Use array destructuring syntax instead
        //         updatedParts[props.modalSelectedPartIndex].fulfilledBy.push({
        //             ...partAllocation,
        //             purchaseOrder: purchaseOrderObjID,
        //             purchaseOrderNumber
        //         })
        //     });
        // }
        // console.log(updatedParts);
        // props.parentForm.setFieldsValue({parts: updatedParts});

        // // TODO: Perform validation
        // // console.log(form.getFieldsValue());
        // // form.resetFields();
        // props.closeModal();
    }

    const onModalCancel = () => {
        props.closeModal();
    }

    // Set the max quantity available for allocation in <InputNumber/>
    const onSelectPurchaseOrder = (value, option, _) => {
        // <Option/>'s key is `purchaseOrderObjID||purchaseOrderSearchIndex`
        // `purchaseOrderSearchIndex` is index to array `purchaseOrderSearches`
        const [purchaseOrderObjID, purchaseOrderSearchIndex] = option.key.split('||');
        const query = queryString.stringify({ populateFulfilledFor: true });

        // Obtain Purchase Order's State (for Fulfillment Information)
        bax.get(`/api/v1/purchaseOrder/${purchaseOrderObjID}/state/latest?${query}`)
            .then(res => {
                const partBeingAllocated = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].part;
                
                // Index of part being allocated in purchase order
                const partIndex = res.data.parts.findIndex(partInfo => partInfo.part === partBeingAllocated);
                let quantityAlreadyAllocated = 0;
                if (res.data.parts[partIndex].fulfilledFor) {
                    res.data.parts[partIndex].fulfilledFor.map(fulfilledForTarget => {
                        quantityAlreadyAllocated += fulfilledForTarget.quantity;
                    })
                }

                // Max quantity that user may enter in <InputNumber/>
                const quantityAvailable = res.data.parts[partIndex].quantity - quantityAlreadyAllocated;
                
                // Update purchaseOrderSearches with maximum quantity
                // available for allocation. This affects <InputNumber/>
                const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                updatedPurchaseOrderSearches[purchaseOrderSearchIndex].max = quantityAvailable;
                setPurchaseOrderSearches(updatedPurchaseOrderSearches);
            }).catch(err => {
                redirectToErrorPage(history, err);
            })
    }


    return(
        <>
            <Modal visible={true}
                   onOk={onModalOk}
                   onCancel={props.closeModal}
                   >
                <Form name='modalPartAllocationForm'
                      form={form}
                      initialValues={{
                          partsAllocationExisting: existingAllocation
                      }}
                      autoComplete='off'
                      >
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
                                    style={{width: '20%', marginRight: '5px'}}
                                    rules={[{ required: true, message: 'Missing Purchase Order Number' }]}
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







                    <Form.List name="partsAllocationNew">
                    {(fields, { add, remove }) => {
                        return (
                        <div>
                            {fields.map((field, index) => (
                            <Row key={field.key} style={{ width: '100%' }} >
                                <Form.Item
                                    {...field}
                                    name={[field.name, 'purchaseOrderNumber']}
                                    fieldKey={[field.fieldKey, 'purchaseOrderNumber']}
                                    key={`${field.fieldKey}-purchaseOrderNumber`}
                                    style={{width: '20%', marginRight: '5px'}}
                                    rules={[{ required: true, message: 'Missing purchase order' }]}
                                >
                                    <Select placeholder='Select Purchase Order'
                                            notFoundContent={purchaseOrderSearches[index].isGettingPurchaseOrderData ? <Spin size='small'/>: null}
                                            filterOption={false}
                                            showSearch={true}
                                            onSearch={(searchValue) => getPurchaseOrderData(searchValue, index)} 
                                            onChange={onSelectPurchaseOrder}>
                                        {
                                            purchaseOrderSearches[index].purchaseOrderData.map(purchaseOrderInfo => {
                                                return (
                                                    <Option key={`${purchaseOrderInfo._id}||${field.fieldKey}`}
                                                            value={`${purchaseOrderInfo._id}||${purchaseOrderInfo.orderNumber}`} >
                                                        {`${purchaseOrderInfo.orderNumber}`}
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
                                    <InputNumber placeholder="Quantity" 
                                                 style={{ width: '100%' }}
                                                 min={purchaseOrderSearches[field.fieldKey].min}
                                                 max={purchaseOrderSearches[field.fieldKey].max}
                                    />
                                </Form.Item>
                
                                <BilboHoverableIconButton
                                    style={{fontSize: '15px'}}
                                    shape='circle'
                                    transformcolor={theme.colors.brightRed}
                                    onClick={() => { 
                                        const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                                        updatedPurchaseOrderSearches.splice(field.fieldKey, 1);
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
                                    min: 0,
                                    max: Number.MAX_SAFE_INTEGER, // FIXME: DEBUG
                                })
                                setPurchaseOrderSearches(updatedPurchaseOrderSearches);
                                add();
                                }}
                            >
                                <PlusOutlined /> Add Another Part Allocation
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
    modalSelectedPartIndex: PropTypes.number.isRequired,
    salesOrderStateData: PropTypes.object.isRequired, // TODO: Marked for removal
    closeModal: PropTypes.func.isRequired,
    parentForm: PropTypes.object.isRequired,
}