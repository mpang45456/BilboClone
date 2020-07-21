import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDividerWithText, 
         BilboDescriptions,
         BilboSearchTable, 
         BilboDisplayOnlySteps,
         BilboHoverableIconButton,
         BilboNavLink } from '../../../UtilComponents';
import { Descriptions, Select, Modal, Divider, Col, Table, Steps, Popover, Spin, message, Form, Input, Button, InputNumber } from 'antd';
const { confirm } = Modal;
const { Option, OptGroup } = Select;
const { Step } = Steps;
import { PlusOutlined, MinusCircleOutlined, StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../../utils';
import debounce from 'lodash/debounce';
import queryString from 'query-string';
import { theme } from '../../../Theme';
import { isEmpty } from 'lodash';
import ExistingPartsFormSection from './ExistingPartsFormSection';
import NewPartsFormSection from './NewPartsFormSection';


// TODO: Check for duplicate part number
/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.QUOTATION` status.
 * 
 * Note: `salesOrderMetaData` and `salesOrderStateData` are
 * guaranteed to be available (see rendering by 
 * `SalesOrderViewPage`)
 * 
 * Note: Since there are 2 types of submission possible (saving
 * changes vs progressing to the next stage), the <Form/>
 * does not use <Button/>s with `htmlType="submit"`. Instead,
 * it handles form submission manually through `onClick` handlers.
 * See `submitForm` for details.
 * 
 * Note: The `additionalInfo` for sales order state data
 * is handled differently. It is not part of the <Form/>
 * state. Its state is handled by a separate React state
 * hook (`stateAdditionalInfo`) and is processed separately
 * in `submitForm`
 */
export default function SalesOrderQuotationContent(props) {
    const [form] = Form.useForm();
    const history = useHistory();
    const [saveChangesLoading, setSaveChangesLoading] = useState(false);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const [stateAdditionalInfo, setStateAdditionalInfo] = useState(props.salesOrderMetaData.additionalInfo);

    const submitForm = async (submissionType) => {
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
                fulfilledBy: partInfo.fulfilledBy,
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
            reqBody.status = SO_STATES.QUOTATION;
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
                content: 'Are you sure you wish to move this sales order to the next status? This is not reversible.',
                onOk: () => {
                    reqBody.status = SO_STATES.CONFIRMED;
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

    // TODO: Refactor components out
    return (
        <>
            <BilboDividerWithText orientation='left'>Sales Order Information</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Order Number">
                    {props.salesOrderMetaData.orderNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Owner" >
                    {props.salesOrderMetaData.createdBy}
                </Descriptions.Item>
                <Descriptions.Item label="Customer" >
                    {props.salesOrderMetaData.customer.name}
                </Descriptions.Item>
                <Descriptions.Item label="Overview Information" >
                    {props.salesOrderMetaData.additionalInfo}
                </Descriptions.Item>
            </BilboDescriptions>
            
            <BilboDividerWithText orientation='left'>Administrative Details</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Additional Information">
                    <Input.TextArea defaultValue={stateAdditionalInfo}
                                    onChange={(e) => setStateAdditionalInfo(e.target.value)}
                                    placeholder='Enter any other information about the sales order here'/>
                </Descriptions.Item>
            </BilboDescriptions>
            <Form name="quotationStatusForm" 
                    form={form}
                    initialValues={{
                        // populate `partsExisting` form section with
                        // existing parts data (from sales order state)
                        partsExisting: props.salesOrderStateData.parts
                    }}
                    autoComplete="off">

                <BilboDividerWithText orientation='left'>Part Details</BilboDividerWithText>
                <ExistingPartsFormSection />
                <NewPartsFormSection />
        
                <Form.Item>
                <Button type="primary" loading={saveChangesLoading} onClick={() => submitForm('saveChanges')}>
                    Save Changes
                </Button>
                </Form.Item>
                
                <Form.Item>
                <Button type="primary" loading={proceedNextStatusLoading} onClick={() => submitForm('proceedNextStatus')}>
                    Confirm and Proceed to Next Status
                </Button>
                </Form.Item>
            </Form>
        </>
    )
}
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}