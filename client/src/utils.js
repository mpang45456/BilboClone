import React from 'react';
import { Modal, message } from 'antd';
const { confirm } = Modal;
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, redirectToErrorPage } from './context/AuthContext';
import CONFIG from './config';

/**
 * Replaces any special characters in a regex
 * with the escaped version (i.e. prefixed with a
 * backslash '\'). Ensures that the entire string
 * is safe for use in a regex.
 * @param {String} str 
 */
export function escapeRegex(str) {
    // $& means the whole matched string
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convenience function to make API call and move 
 * sales order to a new status (without any changes
 * to the state data). This means that the only
 * meta/state data change will be the `latestStatus`
 * and `status` fields.
 * 
 * @param {String} newStatus: one of `SO_STATES`
 * @param {object} stateData: `salesOrderStateData`
 * @param {object} metaData: `salesOrderMetaData`
 * @param {object} history: for use by `redirectToErrorPage`
 * @param {func} setLoading: set the loading status of the 
 *                           `Confirm and Proceed` button
 */
export function setSalesOrderToNextStatus(newStatus, stateData, metaData, history, setLoading) {
    const reqBody = {...stateData};
        
    confirm({
        icon: <ExclamationCircleOutlined />,
        content: 'Are you sure you wish to move this sales order to the next status? This is NOT reversible.',
        onOk: () => {
            reqBody.status = newStatus;
            setLoading(true);
            bax.post(`/api/v1/salesOrder/${metaData._id}/state`, reqBody)
                .then(res => {
                    if (res.status === 200) {
                        history.push(CONFIG.SALES_ORDER_URL);
                        message.success('Successfully moved sales order to next status!')
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })
        },
        okText: 'Confirm'
    })
}