import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboDivider } from '../../../UtilComponents';
import { Space, Modal, Row, message, Form, Button } from 'antd';
const { confirm } = Modal;
import { ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';

/**
 * React Component to render content for Sales Orders
 * that have `SO_STATES.QUOTATION` status.
 * // TODO: Update docs
 */
export default function SalesOrderConfirmedContent(props) {
    return (
        <h1>Confirmed Status Component</h1>
    )
}
SalesOrderConfirmedContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}