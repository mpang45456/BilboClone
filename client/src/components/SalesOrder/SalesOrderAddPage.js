import React, { useState, useEffect } from 'react';
import { Spin, Input, Button, Row, Form, Select, Tag, message } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import debounce from 'lodash/debounce';
import queryString from 'query-string';

import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import { BilboPageHeader, BilboDivider } from '../UtilComponents';
import CONFIG from '../../config';

/**
 * Component for adding a sales order. 
 * 
 * Note: The API calls made by this front-end
 * component will create a new sales order
 * (both meta and state data are created on
 * the back end) and set the latest status to `QUOTATION`. 
 * Once a new sales order is made via the front-end, 
 * it will show up in the `SalesOrderPage` under the 
 * `Quotation` status.
 * 
 * No client-side validation is performed 
 * (apart from checking for presence of the 
 * customer name field).
 * 
 * Note: The displayed customer name is actually
 * submitted via the form, and not the customerObjID.
 */
export default function SalesOrderAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.SALES_ORDER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
     // For POST API call (when clicking on submit button)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const history = useHistory();

    // For populating customerObjIDs and customer's names in 
    // search box
    const [isGettingCustomerData, setIsGettingCustomerData] = useState(false);
    const [customerData, setCustomerData] = useState([]);
    const debounceLimit = 300; //in ms
    let lastFetchID = 0;
    const getCustomerData = debounce((searchValue) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;
        setCustomerData([]);
        setIsGettingCustomerData(true);

        let filter = JSON.stringify({
            "name": { "$regex": searchValue, "$options": "i"},
        })
        let query = queryString.stringify({inc: 'name', filter})
        bax.get(`/api/v1/customer?${query}`, { withCredentials: true })
            .then(res => {
                // Ensure correct order of callback
                // Obsolete (slow) responses would have 
                // a smaller `thisFetchID` and are discarded
                // Note: `thisFetchID` is a local block variable,
                // but `lastFetchID` is a variable local to
                // the entire React component (it keeps incrementing)
                if (thisFetchID === lastFetchID) {
                    setCustomerData(res.data.customers);
                    setIsGettingCustomerData(false);
                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, debounceLimit);

    // Handler when submit button is clicked on
    const tryCreateNewSalesOrder = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/salesOrder', values)
            .then(res => {
                setIsSubmitting(false);
                message.success('Successfully created new sales order!');
                history.push(CONFIG.SALES_ORDER_URL);
            }).catch(err => {
                setIsSubmitting(false);
                redirectToErrorPage(err, history);
            })
    }

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.SALES_ORDER_URL);
    }
    
    // Layout of <Form> 
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    // Note: Search box for Customer Name has value of
    // customer's ObjID, but displays customer's name.
    return (
        <div>
            <BilboPageHeader 
                title='Add a New Sales Order'
                onBack={() => history.push(CONFIG.SALES_ORDER_URL)}
            />
            <BilboDivider />

            <Spin spinning={isSubmitting}>
                <Form name='createNewSalesOrderForm' 
                      onFinish={tryCreateNewSalesOrder}
                      {...formItemLayout} >

                    <Form.Item name='customerName'
                               label='Customer Name'
                               rules={[{ required: true, message: "Please input customer's name!" }]}>
                        <Select placeholder='Select Customer'
                                notFoundContent={isGettingCustomerData ? <Spin size='small'/> : null}
                                filterOption={false}
                                showSearch={true}
                                onSearch={getCustomerData}>
                            {
                                customerData.map(customer => {
                                    return (
                                        <Option key={customer.name}
                                                value={customer.name}>
                                                {customer.name}
                                        </Option>
                                    )
                                })
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item name='additionalInfo' 
                               label='Additional Info'>
                        <Input.TextArea />
                    </Form.Item>

                    <Form.Item>
                        <Row justify='end'>
                            <Button onClick={clickCancelButton}>
                                Cancel
                            </Button>
                            <Button type='primary' htmlType='submit' loading={isSubmitting}>
                                Submit
                            </Button>
                        </Row>
                    </Form.Item>
                </Form>
            </Spin>

        </div>
    )
}
