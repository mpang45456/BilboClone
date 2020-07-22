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
import ModalFormExistingPartAllocationsFormSection from './ModalFormExistingPartAllocationsFormSection';
import ModalFormNewPartAllocationsFormSection from './ModalFormNewPartAllocationsFormSection';






// TODO: Perform checks that PO is allowed for allocation (sufficient parts, has the part etc.)
// TODO: Update docs: Mount a new ModalForm everytime modal is made visible
// TODO: Perform duplicate PO allocation checks
// Allows you to add allocations to multiple purchase orders
export default function ModalForm(props) {
    const history = useHistory();
    const [form] = Form.useForm();
    const partBeingAllocated = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].part;

    /* Stores the search results for each purchase order number search bar
       Has format: 
       {
            isGettingPurchaseOrderData: bool, 
            purchaseOrderData: []
            min: Number
            max: Number
       }
    */
    let existingAllocation = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].fulfilledBy;

    

    const onModalOk = () => {
        // Upon submission of the modal form (by clicking on Ok button),
        // parentForm's data will be updated directly. 
        const updatedParentFormData = () => {
            // Parent Form's state
            let updatedParts = props.parentForm.getFieldValue('parts');
            
            // Existing Parts Allocation
            updatedParts[props.modalSelectedPartIndex].fulfilledBy = form.getFieldsValue().partsAllocationExisting;

            // New Parts Allocation
            if (form.getFieldsValue().partsAllocationNew) {
                form.getFieldsValue().partsAllocationNew.map(partAllocation => {
                    const [purchaseOrderObjID, purchaseOrderNumber] = partAllocation.purchaseOrderNumber.split('||');
                    updatedParts[props.modalSelectedPartIndex].fulfilledBy.push({
                        ...partAllocation,
                        purchaseOrder: purchaseOrderObjID,
                        purchaseOrderNumber
                    })
                });
            }
            props.parentForm.setFieldsValue({parts: updatedParts});
            props.closeModal();
        }

        form.validateFields()
            .then(_ => {
                // Only send request if form is validated
                updatedParentFormData();
            }).catch(_ => {
                // Do nothing. UI displays error message.
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
                    <ModalFormExistingPartAllocationsFormSection />
                    <ModalFormNewPartAllocationsFormSection 
                        partBeingAllocated={partBeingAllocated}
                    />







                    
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