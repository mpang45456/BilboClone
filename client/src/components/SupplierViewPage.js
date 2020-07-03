import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Input, Spin, Descriptions, Button, Row } from 'antd';
import { bax, useAuth, redirectToErrorPage, PERMS } from '../context/AuthContext';
import CONFIG from '../config';
import { BilboDescriptions, BilboPageHeader, BilboDivider, EditableItem } from './UtilComponents';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export default function SupplierViewPage(props) {
    const history = useHistory();
    const [isLoadingSupplierDetails, setIsLoadingSupplierDetails] = useState(true);
    const [supplier, setSupplier] = useState({});

    useEffect(() => {
        bax.get(`/api/v1/supplier/${props.match.params.supplierID}`)
            .then(res => {
                if (res.status === 200) {
                    setSupplier(res.data);
                    setIsLoadingSupplierDetails(false);
                }
            }).catch(err => {
                setIsLoadingSupplierDetails(false);
                redirectToErrorPage(err, history);
            })
    }, [props.location])

    // General function to make API PATCH call when a field is edited and saved
    // Returns a promise (child component is supposed to implement `catch` handler)
    const updateField = (fieldName, newFieldValue) => {
        let patchBody = {};
        patchBody[fieldName] = newFieldValue;
        console.log(patchBody)
        return bax.patch(`/api/v1/supplier/${props.match.params.supplierID}`, patchBody)
                  .then(res => {
                        return bax.get(`/api/v1/supplier/${props.match.params.supplierID}`);
                  }).then(res => {
                    setSupplier(res.data);
                  })
    }
    
    // TODO: Consider adding show more button later
    const title = (
        <div>
            <BilboPageHeader 
                title='Supplier Details'
                onBack={() => history.push(CONFIG.SUPPLIER_URL)}
            />
            <BilboDivider />
        </div>
    )
    return (
        <div>
            <Spin spinning={isLoadingSupplierDetails}>
                <BilboDescriptions title={title}
                                   bordered
                                   column={1}>
                    <Descriptions.Item label="Supplier Name" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.name} 
                                      update={(newName) => updateField('name', newName)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.address} 
                                      update={(newAddress) => updateField('address', newAddress)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Telephone" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.telephone} 
                                      update={(newTelephone) => updateField('telephone', newTelephone)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Fax" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.fax} 
                                      update={(newFax) => updateField('fax', newFax)}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Information" style={{padding: '5px 16px', lineHeight: 2}}>
                        <EditableItem value={supplier.additionalInfo} 
                                      update={(newAdditionalInfo) => updateField('additionalInfo', newAdditionalInfo)}
                                      isTextArea={true}
                                      requiredPerm={PERMS.SUPPLIER_WRITE} />
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>
        </div>
    );
}

