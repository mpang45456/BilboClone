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
// TODO: Perform duplicate PO allocation checks
// Allows you to add allocations to multiple purchase orders
/**
 * React Component that displays a Modal containing
 * a Form that performs part allocation for a specific
 * part (as determined by `props.modalSelectedPartIndex`)
 * 
 * The <ModalForm/> is a separate form from `props.parentForm`.
 * It keeps track of the part allocations, and will manipulate
 * `props.parentForm`'s data upon submission (when the Ok
 * button is clicked on)
 * 
 * The <ModalForm/> allows one part to be allocated to
 * multiple Purchase Orders. It checks for max quantity
 * available for allocation per purchase order (see 
 * <ModalFormNewPartAllocationsFormSection/>), and also
 * checks for duplicate purchase order allocations.
 */
export default function ModalForm(props) {
    const [form] = Form.useForm();
    const partBeingAllocated = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].part;
    const partsAllocationExisting = props.parentForm.getFieldsValue().parts[props.modalSelectedPartIndex].fulfilledBy;

    const onModalOk = () => {
        // Upon submission of the modal form (by clicking on Ok button),
        // parentForm's data will be updated directly. 
        const updateParentFormData = () => {
            // Parent Form's state
            let updatedParts = props.parentForm.getFieldValue('parts');
            
            // Existing Parts Allocation (make a copy)
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

            // Check for duplicate purchase orders
            const POs = updatedParts[props.modalSelectedPartIndex].fulfilledBy.map(_ => _.purchaseOrder);
            const numOfPOs = POs.length;
            const numOfUniquePOs = Array.from(new Set(POs)).length;
            if (numOfPOs !== numOfUniquePOs) {
                message.error('There are duplicate Purchase Orders!');
            } else {
                props.parentForm.setFieldsValue({parts: updatedParts});
                props.closeModal();
            }
        }

        form.validateFields()
            .then(_ => {
                // Only send request if form is validated
                updateParentFormData();
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
                          partsAllocationExisting
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
    closeModal: PropTypes.func.isRequired,
    parentForm: PropTypes.object.isRequired,
}