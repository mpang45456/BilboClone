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
 * Component for adding a purchase order. 
 * 
 * Note: The API calls made by this front-end
 * component will create a new purchase order
 * meta-data and set the latest status to `QUOTATION`, but
 * no purchase order state data is made. Once a new
 * purchase order is made via the front-end, it will
 * show up in the `PurchaseOrderPage` under the 
 * `Quotation` status.
 * 
 * No client-side validation is performed 
 * (apart from checking for presence of the 
 * supplier name field).
 * 
 * Note: The displayed supplier name is actually
 * submitted via the form, and not the supplierObjID.
 */
export default function PurchaseOrderAddPage(props) {
    // Check for authorization, otherwise redirect
    const { permissionsList } = useAuth();
    if (!permissionsList.includes(PERMS.PURCHASE_ORDER_WRITE)) {
        return <Redirect to={CONFIG.ERROR_403_URL}/>
    }
    
     // For POST API call (when clicking on submit button)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const history = useHistory();

    // For populating supplierObjIDs and supplier's names in 
    // search box
    const [isGettingSupplierData, setIsGettingSupplierData] = useState(false);
    const [supplierData, setSupplierData] = useState([]);
    const debounceLimit = 300; //in ms
    let lastFetchID = 0;
    const getSupplierData = debounce((searchValue) => {
        lastFetchID = (lastFetchID + 1) % 1000;
        const thisFetchID = lastFetchID;
        setSupplierData([]);
        setIsGettingSupplierData(true);

        let filter = JSON.stringify({
            "name": { "$regex": searchValue, "$options": "i"},
        })
        let query = queryString.stringify({inc: 'name', filter})
        bax.get(`/api/v1/supplier?${query}`, { withCredentials: true })
            .then(res => {
                // Ensure correct order of callback
                // Obsolete (slow) responses would have 
                // a smaller `thisFetchID` and are discarded
                // Note: `thisFetchID` is a local block variable,
                // but `lastFetchID` is a variable local to
                // the entire React component (it keeps incrementing)
                if (thisFetchID === lastFetchID) {
                    setSupplierData(res.data.suppliers);
                    setIsGettingSupplierData(false);
                }
            }).catch(err => {
                redirectToErrorPage(err, history);
            })
    }, debounceLimit);

    // Handler when submit button is clicked on
    const tryCreateNewPurchaseOrder = (values) => {
        setIsSubmitting(true);
        bax.post('/api/v1/purchaseOrder', values)
            .then(res => {
                setIsSubmitting(false);
                message.success('Successfully created new purchase order!');
                history.push(CONFIG.PURCHASE_ORDER_URL);
            }).catch(err => {
                setIsSubmitting(false);
                redirectToErrorPage(err, history);
            })
    }

    // Handler when cancel button is clicked
    const clickCancelButton = () => {
        history.push(CONFIG.PURCHASE_ORDER_URL);
    }
    
    // Layout of <Form> 
    const formItemLayout = {
        labelCol: { span: 3 },
    };

    // Note: Search box for Supplier Name has value of
    // supplier's ObjID, but displays supplier's name.
    return (
        <div>
            <BilboPageHeader 
                title='Add a New Purchase Order'
                onBack={() => history.push(CONFIG.PURCHASE_ORDER_URL)}
            />
            <BilboDivider />

            <Spin spinning={isSubmitting}>
                <Form name='createNewPurchaseOrderForm' 
                      onFinish={tryCreateNewPurchaseOrder}
                      {...formItemLayout} >

                    <Form.Item name='supplierName'
                               label='Supplier Name'
                               rules={[{ required: true, message: "Please input supplier's name!" }]}>
                        <Select placeholder='Select Supplier'
                                notFoundContent={isGettingSupplierData ? <Spin size='small'/> : null}
                                filterOption={false}
                                showSearch={true}
                                onSearch={getSupplierData}>
                            {
                                supplierData.map(supplier => {
                                    return (
                                        <Option key={supplier.name}
                                                value={supplier.name}>
                                                {supplier.name}
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
