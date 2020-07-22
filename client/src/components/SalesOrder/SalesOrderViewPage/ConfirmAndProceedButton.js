import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Button, Space } from 'antd';
import PropTypes from 'prop-types';
import { SO_STATES } from '../../../../../server/data/databaseEnum';
import { setSalesOrderToNextStatus } from '../../../utils';

/**
 * Only used in a status that does not require
 * changes to state data and only a change to
 * `latestStatus`/`status`. This button calls 
 * `setSalesOrderToNextStatus` on click. 
 */
export default function ConfirmAndProceedButton(props) {
    const [proceedNextStatusLoading, setProceedNextStatusLoading] = useState(false);
    const history = useHistory();
    return (
        <Row justify='end'>
            <Space direction='vertical' style={{display: 'block', width: '20%'}}>
                <Button style={{width: '100%'}} type="primary" 
                        loading={proceedNextStatusLoading} 
                        onClick={() => {setSalesOrderToNextStatus(props.nextState,
                                                                  props.salesOrderStateData,
                                                                  props.salesOrderMetaData,
                                                                  history,
                                                                  setProceedNextStatusLoading
                                                                )}}
                >
                    Confirm and Proceed
                </Button>
            </Space>
        </Row>
    )
}
ConfirmAndProceedButton.propTypes = {
    nextState: PropTypes.oneOf(Object.keys(SO_STATES)),
    salesOrderStateData: PropTypes.object.isRequired,
    salesOrderMetaData: PropTypes.object.isRequired,
}