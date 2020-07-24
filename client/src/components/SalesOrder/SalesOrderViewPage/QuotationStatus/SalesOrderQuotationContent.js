import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboDivider } from '../../../UtilComponents';
import { Space, Modal, Row, message, Form, Button, Statistic } from 'antd';
const { confirm } = Modal;
import { ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
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
 */
export default function SalesOrderQuotationContent(props) {
    const [form] = Form.useForm();
    const history = useHistory();
    const [saveChangesLoading, setSaveChangesLoading] = useState(false);
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const [stateAdditionalInfo, setStateAdditionalInfo] = useState(props.salesOrderStateData.additionalInfo);

    // Computing Total Sales Order Value
    const reducer = (acc, currVal) => acc + currVal.quantity * currVal.latestPrice;
    const [totalSalesOrderValue, setTotalSalesOrderValue] = useState(props.salesOrderStateData.parts.reduce(reducer, 0));

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
                    additionalInfo: partInfo.additionalInfo ? partInfo.additionalInfo : '',
                    fulfilledBy: [],
                })
            })
            // Prepare newly added parts
            formParts.partsNew && formParts.partsNew.map(partInfo => {
                reqBody.parts.push({
                    ...partInfo,
                    additionalInfo: partInfo.additionalInfo ? partInfo.additionalInfo : '',
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
                    content: 'Are you sure you wish to move this sales order to the next status? This is NOT reversible.',
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

        // Perform form validation before sending request
        form.validateFields()
            .then(_ => {
                sendRequest();
            }).catch(err => { 
                // Do nothing (UI will display validation errors)
            });
    }

    // Handler when cancel button is clicked
    const onCancel = () => { history.push(CONFIG.SALES_ORDER_URL); }

    // Handler when form values change in response to user
    // input. This is used to calculate the total sales order
    // value and update the <Statistic/> component.
    const onFormValuesChange = (changedFields, allFields) => {
        const allFormValues = form.getFieldsValue();
        let totalValue = 0;
        // Find total value for existing parts
        allFormValues.partsExisting && allFormValues.partsExisting.map(partInfo => {
            if (partInfo.quantity && 
                typeof partInfo.quantity === 'number' &&
                partInfo.latestPrice &&
                typeof partInfo.latestPrice === 'number') {
                totalValue += partInfo.latestPrice * partInfo.quantity;
            }
        })
        // Find total value for new parts
        allFormValues.partsNew && allFormValues.partsNew.map(partInfo => {
            if (partInfo &&
                partInfo.quantity && 
                typeof partInfo.quantity === 'number' &&
                partInfo.latestPrice &&
                typeof partInfo.latestPrice === 'number') {
                totalValue += partInfo.latestPrice * partInfo.quantity;
            }
        })

        setTotalSalesOrderValue(totalValue);
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
                    onValuesChange={onFormValuesChange}
                    autoComplete="off">

                <BilboDividerWithText orientation='left'>Part Details</BilboDividerWithText>
                <ExistingPartsFormSection />
                <NewPartsFormSection form={form}/>
        
                <BilboDividerWithText orientation='left'>Order Summary</BilboDividerWithText>
                <Statistic title='Total Sales Order Value'
                           value={totalSalesOrderValue}
                           precision={2}
                           prefix='$'
                />
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
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}