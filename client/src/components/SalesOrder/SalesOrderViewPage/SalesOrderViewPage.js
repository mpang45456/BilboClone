import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../../UtilComponents';
import { Menu, Table, Steps, Popover } from 'antd';
const { Step } = Steps;
import { PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { SO_STATES } from '../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../utils';
import queryString from 'query-string';

/**
 * // TODO: Update docs
 */
export default function SalesOrderViewPage(props) {
    // const { permissionsList } = useAuth();
    const [ salesOrderMetaData, setSalesOrderMetaData ] = useState({});
    const [ isLoadingSalesOrderDetails, setIsLoadingSalesOrderDetails] = useState(true);
    useEffect(() => {
        // Get Meta-Data
        bax.get(`/api/v1/salesOrder/${props.match.params.salesOrderID}`)
            .then(res => {
                if (res.status === 200) {
                    setSalesOrderMetaData(res.data);
                    setIsLoadingSalesOrderDetails(false);
                }
            }).catch(err => {
                setIsLoadingSalesOrderDetails(false);
                redirectToErrorPage(err, history);
            })
    }, []) // Run only once (on component mounting)

    function renderSwitcher(latestStatus) {
        switch (latestStatus) {
            case 'QUOTATION':
                return <span>QUOTATION</span>
            case 'CONFIRMED':
                return <span>CONFIRMED</span>
            case 'PREPARING':
                return <span>PREPARING</span>
            case 'IN_DELIVERY':
                return <span>IN_DELIVERY</span>
            case 'RECEIVED':
                return <span>RECEIVED</span>
            case 'FULFILLED':
                return <span>FULFILLED</span>
        }
    }

    return (
        <div>
            { renderSwitcher(salesOrderMetaData.latestStatus) }
        </div>
    );
}