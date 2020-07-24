import React from 'react';
import { Collapse } from 'antd';
const { Panel } = Collapse;
import PropTypes from 'prop-types';
import SalesOrderMetaDataDisplaySection from './SalesOrderMetaDataDisplaySection';
import SalesOrderStateDataDisplaySection from './SalesOrderStateDataDisplaySection';

/**
 * React Component with a Collapsible Panel
 * displaying Sales Order Meta and State Data.
 */
export default function CollapsibleSalesOrderDataDisplay(props) {
    return (
        <>
            <Collapse>
                <Panel header='Sales Order Details'>
                    <SalesOrderMetaDataDisplaySection 
                        salesOrderMetaData={props.salesOrderMetaData} 
                    />

                    <SalesOrderStateDataDisplaySection
                        salesOrderStateData={props.salesOrderStateData} 
                    />
                </Panel>
            </Collapse>
        </>
    )
}
CollapsibleSalesOrderDataDisplay.propTypes = {
    salesOrderMetaData: PropTypes.object.isRequired,
}
