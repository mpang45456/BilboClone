import React, { useState, useEffect } from 'react';
import { Spin, Input, Button, Row, Form, Select, message } from 'antd';
const { Option } = Select;
import { Redirect, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import { BilboPageHeader, BilboDivider } from '../UtilComponents';
import CONFIG from '../../config';

// TODO: Update docs
// /**
//  * Component for adding a supplier.
//  * 
//  * No client-side validation is performed 
//  * (except for checking for presence of the 
//  * `name` field, because it is a required field.
//  * All other fields are optional).
//  * 
//  * Note: Because the `name` field must be unique, 
//  * the error message from the API call is checked
//  * for any indication of a duplicate supplier error,
//  * in which case, a help/error message is indicated
//  * in the supplier name's <Input />.
//  */
// TODO: Can specify supplierID in props.
export default function PartAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.PART_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
     // For POST API call (when clicking on submit button)
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    const tryCreateNewPart = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/part', values)
            .then(res => {
                setIsSubmitting(false);
                message.success('Successfully created new part');
                history.push(CONFIG.PARTS_URL);
            }).catch(err => {
                setIsSubmitting(false);
                // TODO: Update
                // if (err.response.data === 'Duplicate Supplier Name') {
                //     setNameValidationStatus('error');
                //     setNameErrorMsg('A supplier of the same name already exists');
                // } else {
                //     redirectToErrorPage(err, history);
                // }
            })
    }

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.PARTS_URL);
    }
    
    // Layout of <Form> 
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    return (
        <div>
            <BilboPageHeader 
                title='Add a New Part'
                onBack={() => history.push(CONFIG.PARTS_URL)}
            />
            <BilboDivider />

            <Spin spinning={isSubmitting}>
                <Form name='createNewPartForm' 
                      onFinish={tryCreateNewPart}
                      {...formItemLayout} >

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
PartAddPage.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
}
