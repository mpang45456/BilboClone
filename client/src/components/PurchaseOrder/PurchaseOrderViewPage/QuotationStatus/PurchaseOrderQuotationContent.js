import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboDivider } from '../../../UtilComponents';
import { Space, Modal, Row, message, Form, Button } from 'antd';
const { confirm } = Modal;
import { ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { PO_STATES } from '../../../../../../server/data/databaseEnum';
import PurchaseOrderMetaDataDisplaySection from '../PurchaseOrderMetaDataDisplaySection';
import PurchaseOrderStateAdditionalInfoEditableSection from '../PurchaseOrderStateAdditionalInfoEditableSection';
import ExistingPartsFormSection from './ExistingPartsFormSection';
import NewPartsFormSection from './NewPartsFormSection';

// TODO: Check for duplicate part number
/**
 * React Component to render content for Purchase Orders
 * that have `PO_STATES.QUOTATION` status.
 * 
 * Note: `purchaseOrderMetaData` and `purchaseOrderStateData` are
 * guaranteed to be available (see rendering by 
 * `PurchaseOrderViewPage`)
 * 
 * Note: Since there are 2 types of submission possible (saving
 * changes vs progressing to the next stage), the <Form/>
 * does not use <Button/>s with `htmlType="submit"`. Instead,
 * it handles form submission manually through `onClick` handlers.
 * See `submitForm` for details.
 * 
 * Note: The `additionalInfo` for purchase order state data
 * is handled differently. It is not part of the <Form/>
 * state. Its state is handled by a separate React state
 * hook (`stateAdditionalInfo`) and is processed separately
 * in `submitForm`
 */
export default function PurchaseOrderQuotationContent(props) {
    const [form] = Form.useForm();
    const history = useHistory();
    const [saveChangesLoading, setSaveChangesLoading] = useState(false);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const [stateAdditionalInfo, setStateAdditionalInfo] = useState(props.purchaseOrderStateData.additionalInfo);

    // Handler when either `Save Changes` or `Confirm and Proceed`
    // buttons are clicked
    const submitForm = async (submissionType) => {
        const sendRequest = () => {
            // Prepare request body
            let reqBody = { additionalInfo: stateAdditionalInfo,
                            parts: [] };
            // Prepare existing parts
            let formParts = form.getFieldsValue();
            formParts.partsExisting && formParts.partsExisting.map(partInfo => {
                reqBody.parts.push({
                    part: partInfo.part,
                    quantity: partInfo.quantity,
                    additionalInfo: partInfo.additionalInfo,
                    fulfilledBy: [],
                })
            })
            // Prepare newly added parts
            formParts.partsNew && formParts.partsNew.map(partInfo => {
                reqBody.parts.push({
                    ...partInfo,
                    fulfilledBy: [],
                })
            })
    
            if (submissionType === 'saveChanges') {
                reqBody.status = PO_STATES.QUOTATION;
                setSaveChangesLoading(true);
                bax.post(`/api/v1/purchaseOrder/${props.purchaseOrderMetaData._id}/state`, reqBody)
                    .then(res => {
                        if (res.status === 200) {
                            history.push(CONFIG.PURCHASE_ORDER_URL);
                            message.success('Successfully updated purchase order!')
                        }
                    }).catch(err => {
                        redirectToErrorPage(err, history);
                    })
            } else if (submissionType === 'proceedNextStatus') {
                confirm({
                    icon: <ExclamationCircleOutlined />,
                    content: 'Are you sure you wish to move this purchase order to the next status? This is NOT reversible.',
                    onOk: () => {
                        reqBody.status = PO_STATES.CONFIRMED;
                        setProceedNextStatusLoading(true);
                        bax.post(`/api/v1/purchaseOrder/${props.purchaseOrderMetaData._id}/state`, reqBody)
                            .then(res => {
                                if (res.status === 200) {
                                    history.push(CONFIG.PURCHASE_ORDER_URL);
                                    message.success('Successfully moved purchase order to next status!')
                                }
                            }).catch(err => {
                                redirectToErrorPage(err, history);
                            })
                    },
                    okText: 'Confirm'
                })
            }
        }

        // Perform form validation before sending request
        form.validateFields()
            .then(_ => {
                sendRequest();
            }).catch(err => { 
                // Do nothing (UI will display validation errors)
            });
    }

    // Handler when cancel button is clicked
    const onCancel = () => { history.push(CONFIG.PURCHASE_ORDER_URL); }

    return (
        <>
            <PurchaseOrderMetaDataDisplaySection 
                purchaseOrderMetaData={props.purchaseOrderMetaData} 
            />
            
            <PurchaseOrderStateAdditionalInfoEditableSection 
                stateAdditionalInfo={stateAdditionalInfo}
                setStateAdditionalInfo={setStateAdditionalInfo} 
            />

            <Form name="quotationStatusForm" 
                    form={form}
                    initialValues={{
                        // populate `partsExisting` form section with
                        // existing parts data (from purchase order state)
                        partsExisting: props.purchaseOrderStateData.parts
                    }}
                    autoComplete="off">

                <BilboDividerWithText orientation='left'>Part Details</BilboDividerWithText>
                <ExistingPartsFormSection />
                <NewPartsFormSection />
        
                <BilboDivider />
                <Row justify='end'>
                    <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                        <Row style={{ display: 'flex', alignContent: 'space-between' }}>
                            <Button style={{flexGrow: 1}} type="default" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button style={{flexGrow: 1}} type="default" loading={saveChangesLoading} onClick={() => submitForm('saveChanges')}>
                                Save Changes
                            </Button>
                        </Row>
                        
                        <Button style={{width: '100%'}} type="primary" loading={proceedNextStatusLoading} onClick={() => submitForm('proceedNextStatus')}>
                            Confirm and Proceed
                        </Button>
                    </Space>
                </Row>
            </Form>
        </>
    )
}
PurchaseOrderQuotationContent.propTypes = {
    purchaseOrderStateData: PropTypes.object.isRequired,
    purchaseOrderMetaData: PropTypes.object.isRequired,
}