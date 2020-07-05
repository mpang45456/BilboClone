import React, { useState, useEffect } from 'react';
import { Spin, Input, Button, Row, Form, Select, message } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import { BilboPageHeader, BilboDivider } from '../UtilComponents';
import CONFIG from '../../config';

/**
 * Component for adding a supplier.
 * 
 * No client-side validation is performed 
 * (except for checking for presence of the 
 * `name` field, because it is a required field.
 * All other fields are optional).
 * 
 * Note: Because the `name` field must be unique, 
 * the error message from the API call is checked
 * for any indication of a duplicate supplier error,
 * in which case, a help/error message is indicated
 * in the supplier name's <Input />.
 */
export default function SupplierAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.SUPPLIER_WRITE)) {
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
    // duplicate supplier name error is first detected.
    const nameOnChange = (e) => {
        setNameValidationStatus('');
        setNameErrorMsg(undefined);
    }

    // Handler when submit button is clicked on
    const tryCreateNewSupplier = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/supplier', values)
            .then(res => {
                setIsSubmitting(false);
                message.success('Successfully created new supplier');
                history.push(CONFIG.SUPPLIER_URL);
            }).catch(err => {
                setIsSubmitting(false);
                if (err.response.data === 'Duplicate Supplier Name') {
                    setNameValidationStatus('error');
                    setNameErrorMsg('A supplier of the same name already exists');
                } else {
                    redirectToErrorPage(err, history);
                }
            })
    }

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.SUPPLIER_URL);
    }
    
    // Layout of <Form> 
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    return (
        <div>
            <BilboPageHeader 
                title='Add a New Supplier'
                onBack={() => history.push(CONFIG.SUPPLIER_URL)}
            />
            <BilboDivider />

            <Spin spinning={isSubmitting}>
                <Form name='createNewSupplierForm' 
                      labelAlign='left'
                      onFinish={tryCreateNewSupplier}
                      {...formItemLayout} >
                    <Form.Item name='name' 
                               label='Supplier Name'
                               rules={[{ required: true, message: "Please input supplier's name!" }]}
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

                    <Form.Item name='additionalInfo' 
                               label='Additional Information' >
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
SupplierAddPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}
