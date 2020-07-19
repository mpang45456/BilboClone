import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../UtilComponents';
import { Menu, Table, Steps, Popover } from 'antd';
const { Step } = Steps;
import { PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { SO_STATES } from '../../../../server/data/databaseEnum';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * // TODO: Update docs
 */
export default function SalesOrderAddPage(props) {
    // const { permissionsList } = useAuth();
    return (
        <div>
            Add a Sales Order Here!
        </div>
    );
}