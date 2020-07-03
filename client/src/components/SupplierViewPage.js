import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Input, Spin, Descriptions, Button } from 'antd';
import { bax, useAuth, redirectToErrorPage } from '../context/AuthContext';
import CONFIG from '../config';
import { BilboDescriptions, BilboPageHeader, BilboDivider } from './UtilComponents';

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

    // TODO: Refactor and make more general
    const updateSupplierName = (newName) => {
        bax.patch(`/api/v1/supplier/${props.match.params.supplierID}`, {'name': newName})
            .then(res => {
                bax.get(`/api/v1/supplier/${props.match.params.supplierID}`)
                    .then(res => {
                        setSupplier(res.data);
                    })
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
                    <Descriptions.Item label="Supplier Name">
                        <EditableItem value={supplier.name} update={updateSupplierName}/>
                    </Descriptions.Item>
                </BilboDescriptions>
            </Spin>
        </div>
    );
}

function EditableItem(props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editItemValue, setEditItemValue] = useState(props.value);

    const isEditingItem = (
        <div>
            <Input defaultValue={props.value}
                   onChange={e => setEditItemValue(e.target.value)} />
            <Button onClick={() => {
                setEditItemValue(props.value);
                setIsEditing(false);
            }}>
                Cancel
            </Button>
            <Button onClick={() => {
                props.update(editItemValue);
                setIsEditing(false)
            }}>
                Save
            </Button>
        </div>
    )

    const notIsEditingItem = (
        <div>
            <div>
                {props.value}
            </div>
            <Button onClick={() => {
                setIsEditing(true);
            }}>
                Edit
            </Button>
        </div>
    )

    return (
        <div>
            {
                isEditing 
                ? isEditingItem
                : notIsEditingItem
            }
        </div>
    )

}