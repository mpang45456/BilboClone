import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboDisplayOnlySteps,
         BilboHoverableIconButton,
         BilboNavLink } from '../../../UtilComponents';
import { Menu, Select, Modal, Row, Col, Table, Steps, Popover, Spin, message, Form, Input, Button, InputNumber } from 'antd';
const { confirm } = Modal;
const { Option, OptGroup } = Select;
const { Step } = Steps;
import { PlusOutlined, MinusCircleOutlined, StopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import { SO_STATES } from '../../../../../../server/data/databaseEnum';
import { escapeRegex } from '../../../../utils';
import debounce from 'lodash/debounce';
import queryString from 'query-string';
import { theme } from '../../../Theme';
import { isEmpty } from 'lodash';
import ExistingPartsFormSection from './ExistingPartsFormSection';
import NewPartsFormSection from './NewPartsFormSection';


// TODO: Update docs
// TODO: Check for duplicate part number
// This component is only rendered by `SalesOrderViewPage`
// if salesOrderMetaData and salesOrderStateData are available
// so there is no need to handle the case when the API call has 
// not returned 
export default function SalesOrderQuotationContent(props) {
    const onFinish = (values) => {
        // TODO: TO BE IMPLEMENTED
        console.log(values);
    }

    return (
        <Form name="quotationStatusForm" 
                onFinish={onFinish}
                initialValues={{
                    // populate `partsExisting` form section with
                    // existing parts data (from sales order state)
                    partsExisting: props.salesOrderStateData.parts
                }}
                autoComplete="off"
                >
            <ExistingPartsFormSection />
            <NewPartsFormSection />
    
            <Form.Item>
            <Button type="primary" htmlType="submit">
                Submit
            </Button>
            </Form.Item>
        </Form>
    )
}
SalesOrderQuotationContent.propTypes = {
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}