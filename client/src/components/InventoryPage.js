import React from 'react'
import { useAuth } from '../context/AuthContext';

export default function InventoryPage(props) {
    const { permissionsList } = useAuth();

    if (permissionsList.includes('PURCHASES_READ')) {
        return (
            <div>
                <h1>Purchases Authorized Inventory Page</h1>
            </div>
        )
    } else {
        return (
            <div>
                <h1>Normal Inventory Page</h1>
            </div>
        )
    }
}