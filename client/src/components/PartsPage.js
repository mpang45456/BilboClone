import React from 'react'
import { useAuth } from '../context/AuthContext';

export default function PartsPage(props) {
    const { permissionsList } = useAuth();

    if (permissionsList.includes('PURCHASES_READ')) {
        return (
            <div>
                <h1>Purchases Authorized Parts Page</h1>
            </div>
        )
    } else {
        return (
            <div>
                <h1>Normal Parts Page</h1>
            </div>
        )
    }
}