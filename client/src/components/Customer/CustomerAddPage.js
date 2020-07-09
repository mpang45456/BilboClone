import React, { useState, useEffect } from 'react';
import { Spin, Input, Button, Row, Form, Select, message } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import { BilboPageHeader, BilboDivider } from '../UtilComponents';
import CONFIG from '../../config';

/**
 * Component for adding a customer.
 * 
 * No client-side validation is performed 
 * (except for checking for presence of the 
 * `name` and `pointOfContact` fields, because 
 * they are required fields. All other fields 
 * are optional).
 * 
 * Note: Because the `name` field must be unique, 
 * the error message from the API call is checked
 * for any indication of a duplicate customer error,
 * in which case, a help/error message is indicated
 * in the customer name's <Input />.
 */
export default function CustomerAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.CUSTOMER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
     // For POST API call (when clicking on submit button)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nameValidationStatus, setNameValidationStatus] = useState('');
    const [nameErrorMsg, setNameErrorMsg] = useState(undefined);
    const history = useHistory();

    // Resets name error message and validation status
    // everytime the user types in the name <Input />
    // Ensures that error message is only displayed when
    // duplicate customer name error is first detected.
    const nameOnChange = (e) => {
        setNameValidationStatus('');
        setNameErrorMsg(undefined);
    }

    // Handler when submit button is clicked on
    const tryCreateNewCustomer = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/customer', values)
            .then(res => {
                setIsSubmitting(false);
                message.success('Successfully created new customer');
                history.push(CONFIG.CUSTOMER_URL);
            }).catch(err => {
                setIsSubmitting(false);
                if (err.response.data === 'Duplicate Customer Name') {
                    setNameValidationStatus('error');
                    setNameErrorMsg('A customer of the same name already exists');
                } else {
                    redirectToErrorPage(err, history);
                }
            })
    }

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.CUSTOMER_URL);
    }
    
    // Layout of <Form> 
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    return (
        <div>
            <BilboPageHeader 
                title='Add a New Customer'
                onBack={() => history.push(CONFIG.CUSTOMER_URL)}
            />
            <BilboDivider />

            <Spin spinning={isSubmitting}>
                <Form name='createNewCustomerForm' 
                      onFinish={tryCreateNewCustomer}
                      {...formItemLayout} >
                    <Form.Item name='name' 
                               label='Customer Name'
                               rules={[{ required: true, message: "Please input customer's name!" }]}
                               hasFeedback
                               validateStatus={nameValidationStatus}
                               help={nameErrorMsg}>
                        <Input onChange={nameOnChange}/>
                    </Form.Item>

                    <Form.Item name='address' 
                               label='Address'>
                        <Input />
                    </Form.Item>

                    <Form.Item name='telephone' 
                               label='Telephone' >
                        <Input />
                    </Form.Item>

                    <Form.Item name='fax' 
                               label='Fax' >
                        <Input />
                    </Form.Item>

                    <Form.Item name='email' 
                               label='Email' >
                        <Input />
                    </Form.Item>

                    <Form.Item name='pointOfContact' 
                               rules={[{ required: true, message: "Please input name of point of contact with customer!" }]}
                               label='Point Of Contact' >
                        <Input />
                    </Form.Item>

                    <Form.Item name='additionalInfo' 
                               label='Additional Info' >
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
CustomerAddPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}
