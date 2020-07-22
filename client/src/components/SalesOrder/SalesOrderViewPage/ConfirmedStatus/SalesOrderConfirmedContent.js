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
import PartAllocationFormList from './PartAllocationFormList';
import ModalForm from './ModalForm';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.CONFIRMED` status.
 * 
 * Note: Management of state for `salesOrderStateData`'s
 * `additionalInfo` field is in a separate react 
 * state and not managed by the <Form/> component
 * directly. 
 * 
 * Note: The <Form/> Component here is responsible for
 * making API calls, not the form in the <ModalForm/>. 
 * These are 2 completely separate forms. 
 * 
 * Note: The <Form/> Component here is relatively dumb. It is
 * merely used as a store of data meant for submission. 
 * The manipulation of form data (for parts allocation 
 * to purchase orders) is done in the <ModalForm />,
 * which has its own form state, but manipulates the
 * this <Form/> Component's data directly upon submission
 * of the modal form. 
 * 
 * Note: It is imperative for the <ModalForm/> component
 * to be mounted/unmounted every time it is displayed/closed.
 * This ensures that the form state within the <ModalForm/>
 * is refreshed every time the `Allocate` button is clicked
 * on. This mounting/unmounting is achieved by the `isModalVisible`
 * state. If `isModalVisible` is truthy, then <ModalForm/>
 * is mounted. 
 * 
 * // TODO: Update docs
 */
export default function SalesOrderConfirmedContent(props) {
    // Pre-process `salesOrderStateData` into format usable by <Form/>
    let salesOrderStateData = {...props.salesOrderStateData};
    salesOrderStateData.parts = salesOrderStateData.parts.map(partInfo => {
        return {
            ...partInfo,
            fulfilledBy: partInfo.fulfilledBy.map(fulfilledByTarget => {
                return {
                    ...fulfilledByTarget,
                    purchaseOrder: fulfilledByTarget.purchaseOrder._id,
                    purchaseOrderNumber: fulfilledByTarget.purchaseOrder.orderNumber,
                }
            })
        }
    })

    const [form] = Form.useForm();
    const history = useHistory();
    const [saveChangesLoading, setSaveChangesLoading] = useState(false);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const [stateAdditionalInfo, setStateAdditionalInfo] = useState(salesOrderStateData.additionalInfo); // Managed differently from the form
    
    // The index of the part (wrt `salesOrderStateData.parts`) to be allocated
    const [modalSelectedPartIndex, setModalSelectedPartIndex] = useState(0);
    // Determines whether to display the modal (will also cause modal to mount/unmount)
    const [isModalVisible, setIsModalVisible] = useState(false);

    const onAllocateButtonClick = (index) => {
        setModalSelectedPartIndex(index);
        setIsModalVisible(true);
    }

    // Handler when either `Save Changes` or `Confirm and Proceed`
    // buttons are clicked
    const submitForm = async (submissionType) => {
        // Prepare request body
        let reqBody = { additionalInfo: stateAdditionalInfo, 
                        parts: [] };
        // Prepare parts data (esp. `fulfilledBy`)
        let formData = form.getFieldsValue();
        formData.parts && formData.parts.map(partInfo => {
            reqBody.parts.push({
                part: partInfo.part,
                quantity: partInfo.quantity,
                additionalInfo: partInfo.additionalInfo,
                fulfilledBy: partInfo.fulfilledBy,
            })
        })

        if (submissionType === 'saveChanges') {
            reqBody.status = SO_STATES.CONFIRMED;
            setSaveChangesLoading(true);
            bax.post(`/api/v1/salesOrder/${props.salesOrderMetaData._id}/state`, reqBody)
                .then(res => {
                    if (res.status === 200) {
                        history.push(CONFIG.SALES_ORDER_URL);
                        message.success('Successfully updated sales order!')
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })
        } else if (submissionType === 'proceedNextStatus') {
            confirm({
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you wish to move this sales order to the next status? This is NOT reversible.',
                onOk: () => {
                    reqBody.status = SO_STATES.PREPARING;
                    setProceedNextStatusLoading(true);
                    bax.post(`/api/v1/salesOrder/${props.salesOrderMetaData._id}/state`, reqBody)
                        .then(res => {
                            if (res.status === 200) {
                                history.push(CONFIG.SALES_ORDER_URL);
                                message.success('Successfully moved sales order to next status!')
                            }
                        }).catch(err => {
                            redirectToErrorPage(err, history);
                        })
                },
                okText: 'Confirm'
            })
        }
    }

    return (
        <>
            <Form name='confirmedStatusForm'
                  form={form}
                  initialValues={{
                      parts: salesOrderStateData.parts
                  }}
                  autoComplete='off'
            >
                <PartAllocationFormList 
                    form={form}
                    onAllocateButtonClick={onAllocateButtonClick}
                />

                <Row justify='end'>
                    <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                        <Row style={{ display: 'flex', alignContent: 'space-between' }}>
                            <Button style={{flexGrow: 1}} type="default" 
                                    onClick={() => history.push(CONFIG.SALES_ORDER_URL)}>
                                Cancel
                            </Button>
                            <Button style={{flexGrow: 1}} type="default" 
                                    loading={saveChangesLoading} 
                                    onClick={() => submitForm('saveChanges')}>
                                Save Changes
                            </Button>
                        </Row>
                        
                        <Button style={{width: '100%'}} type="primary" 
                                loading={proceedNextStatusLoading} 
                                onClick={() => submitForm('proceedNextStatus')}>
                            Confirm and Proceed
                        </Button>
                    </Space>
                </Row>
            </Form>

            {/* Ensures that a fresh <ModalForm/> is mounted everytime
                the `Allocate` button is clicked on
             */}
            { 
                isModalVisible 
                ? <ModalForm salesOrderStateData={salesOrderStateData}
                             modalSelectedPartIndex={modalSelectedPartIndex}
                             closeModal={() => {setIsModalVisible(false)}}
                             parentForm={form} />
                : null                           
            }
        </>
    )
}
SalesOrderConfirmedContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}
