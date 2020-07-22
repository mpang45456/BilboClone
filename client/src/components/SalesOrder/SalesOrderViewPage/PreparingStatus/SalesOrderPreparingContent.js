import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboHoverableIconButton,
         DarkInvertedStyledButton,
         BilboDivider } from '../../../UtilComponents';
import { Space, Modal, Row, message, Select, Tag, Form, Button, Input, InputNumber } from 'antd';
const { confirm } = Modal;
const { Option } = Select;
import { ExclamationCircleOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import { theme } from '../../../Theme';
import { debounce } from 'lodash';
import queryString from 'query-string';
import PartAllocationFormList from './PartAllocationFormList';
import ModalForm from './ModalForm';
import SalesOrderMetaDataDisplaySection from '../SalesOrderMetaDataDisplaySection';
import SalesOrderStateAdditionalInfoEditableSection from '../SalesOrderStateAdditionalInfoEditableSection';

export default function SalesOrderPreparingContent(props) {
    return (
        <h1>Hello World. This is Preparing Status Content</h1>
    )
}