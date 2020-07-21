import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDividerWithText, 
         BilboDivider,
         BilboDescriptions,
         BilboSearchTable, 
         BilboDisplayOnlySteps,
         BilboHoverableIconButton,
         BilboNavLink } from '../../../UtilComponents';
import { Descriptions, Select, Space, Modal, Divider, Col, Row, Table, Steps, Popover, Spin, message, Form, Input, Button, InputNumber } from 'antd';
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
import SalesOrderMetaDataDisplaySection from '../SalesOrderMetaDataDisplaySection';
import SalesOrderStateAdditionalInfoEditableSection from '../SalesOrderStateAdditionalInfoEditableSection';
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
 * 
 * // TODO: Perform form validation
 */
export default function SalesOrderQuotationContent(props) {
    const [form] = Form.useForm();
    const history = useHistory();
    const [saveChangesLoading, setSaveChangesLoading] = useState(false);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const [stateAdditionalInfo, setStateAdditionalInfo] = useState(props.salesOrderStateData.additionalInfo);

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

    return (
        <>
            <SalesOrderMetaDataDisplaySection 
                salesOrderMetaData={props.salesOrderMetaData} 
            />
            
            <SalesOrderStateAdditionalInfoEditableSection 
                stateAdditionalInfo={stateAdditionalInfo}
                setStateAdditionalInfo={setStateAdditionalInfo} 
            />

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
        
                <BilboDivider />
                <Row justify='end'>
                    <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                        <Row style={{ display: 'flex', alignContent: 'space-between' }}>
                            <Button style={{marginRight: '5px'}} type="default" onClick={() => console.log('cancelled!')}>
                                Cancel
                            </Button>
                            <Button style={{flexGrow: 2}} type="default" loading={saveChangesLoading} onClick={() => submitForm('saveChanges')}>
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
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}