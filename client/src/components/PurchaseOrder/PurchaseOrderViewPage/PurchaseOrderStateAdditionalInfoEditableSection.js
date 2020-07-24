import React from 'react';
import { BilboDividerWithText, 
         BilboDescriptions } from '../../UtilComponents';
import { Descriptions, Input } from 'antd';
import PropTypes from 'prop-types';

/**
 * React Component that displays and edits the 
 * `additionalInfo` field in a purchase order state.
 */
export default function PurchaseOrderStateAdditionalInfoEditableSection(props) {
    return (
        <>
            <BilboDividerWithText orientation='left'>Administrative Details</BilboDividerWithText>
            <BilboDescriptions bordered column={1}>
                <Descriptions.Item label="Additional Information">
                    <Input.TextArea defaultValue={props.stateAdditionalInfo}
                                    onChange={(e) => props.setStateAdditionalInfo(e.target.value)}
                                    placeholder='Enter any other information about the purchase order here'/>
                </Descriptions.Item>
            </BilboDescriptions>
        </>
    )
}
PurchaseOrderStateAdditionalInfoEditableSection.propTypes = {
    stateAdditionalInfo: PropTypes.string.isRequired,
    setStateAdditionalInfo: PropTypes.func.isRequired,
}