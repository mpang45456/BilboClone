import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Spin, Descriptions, Tabs, Modal, Menu, message } from 'antd';
const { TabPane } = Tabs;
const { confirm } = Modal;
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboDescriptions, BilboPageHeader, BilboDivider, EditableItem, ShowMoreButton, BilboSearchTable, BilboNavLink } from '../../UtilComponents';
import PropTypes from 'prop-types';
import queryString from 'query-string';

// TODO: Update docs
export default function PriceHistoryTabContent(props) {
    
}
PriceHistoryTabContent.propTypes = {
}
