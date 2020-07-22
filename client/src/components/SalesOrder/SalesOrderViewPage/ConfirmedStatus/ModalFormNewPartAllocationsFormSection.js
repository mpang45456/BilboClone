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
 * React Component that allows user to dynamically
 * add part allocations (i.e. map a part to a particular
 * purchase order and specify the quantity).
 * 
 * Note: A check is performed to ensure that the quantity
 * of a part allocated to a certain purchase order does not
 * exceed the quantity available for allocation. However, 
 * an error message does not show this. Instead, the 
 * <InputNumber/> field simply updates itself automatically
 * to the maximum available quantity. This is the in-built
 * behaviour of <InputNumber/>
 */
export default function ModalFormNewPartAllocationsFormSection(props) {
    /* Stores the search results for each purchase order search bar
       Has the following format: 
       {
            isGettingPurchaseOrderData: bool, 
            purchaseOrderData: []
            min: Number (min quantity for allocation: 0)
            max: Number (max quantity for allocation)
       }
    */
    const [purchaseOrderSearches, setPurchaseOrderSearches] = useState([]);

    // Function for retrieving Purchase Orders that fit search description
    let lastFetchID = 0;
    const getPurchaseOrderData = debounce((searchValue, index) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;

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
                    // Filter to keep only purchase orders that contain
                    // `props.partBeingAllocated` (only POs with the part
                    // should be allocatable)
                    Promise.all(res.data.purchaseOrders.map(purchaseOrderMetaData => {
                        // Obtain latest state for each PO (to obtain part data)
                        return bax.get(`/api/v1/purchaseOrder/${purchaseOrderMetaData._id}/state/latest`)
                                  .then(res => res.data);
                    })).then(poLatestStateArr => {
                        let filteredPOs = [];
                        poLatestStateArr.map((poLatestState, i) => {
                            // PO contains `props.partBeingAllocated`
                            if (poLatestState.parts.findIndex(partInfo => partInfo.part === props.partBeingAllocated) !== -1) {
                                filteredPOs.push(res.data.purchaseOrders[i]);
                            }
                        })
                        
                        // Update the purchase order searches
                        const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                        updatedPurchaseOrderSearches[index].purchaseOrderData = filteredPOs;
                        updatedPurchaseOrderSearches[index].isGettingPurchaseOrderData = false;
                        setPurchaseOrderSearches(updatedPurchaseOrderSearches);
                    })

                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, CONFIG.DEBOUNCE_LIMIT);

    // Set the max quantity available for allocation in <InputNumber/>
    const onSelectPurchaseOrder = (value, option, _) => {
        // <Option/>'s key is `purchaseOrderObjID||purchaseOrderSearchIndex`
        // `purchaseOrderSearchIndex` is index to array `purchaseOrderSearches`
        // and identifies which dynamically added search box is being used
        const [purchaseOrderObjID, purchaseOrderSearchIndex] = option.key.split('||');
        const query = queryString.stringify({ populateFulfilledFor: true });

        // Obtain Purchase Order's State (for Fulfillment Information)
        bax.get(`/api/v1/purchaseOrder/${purchaseOrderObjID}/state/latest?${query}`)
            .then(res => {
                // Index of part being allocated in purchase order
                const partIndex = res.data.parts.findIndex(partInfo => partInfo.part === props.partBeingAllocated);
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

    return (
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
                                            min={purchaseOrderSearches[field.fieldKey] && purchaseOrderSearches[field.fieldKey].min || 0}
                                            max={purchaseOrderSearches[field.fieldKey] && purchaseOrderSearches[field.fieldKey].max || Number.MAX_SAFE_INTEGER}
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
                        const updatedPurchaseOrderSearches = [...purchaseOrderSearches];
                        updatedPurchaseOrderSearches.push({
                            isGettingPurchaseOrderData: false,
                            purchaseOrderData: [],
                            min: 0,
                            max: Number.MAX_SAFE_INTEGER,
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
    )
}
ModalFormNewPartAllocationsFormSection.propTypes = {
    partBeingAllocated: PropTypes.string.isRequired,
}