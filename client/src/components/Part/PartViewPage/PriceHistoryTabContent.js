import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Timeline, Tooltip, Form, Modal, Input, message } from 'antd';
import { PlusCircleOutlined } from "@ant-design/icons";
import { useAuth, PERMS } from '../../../context/AuthContext';
import { BilboTimelineWithTrailingEnd,
         BilboTimelineParagraph, 
         BilboTimelineParagraphDescription,
         BilboHoverableIconButton } from '../../UtilComponents';
import PropTypes from 'prop-types';
import moment from 'moment';
import { withTheme } from 'styled-components';

/**
 * Tab Pane displaying Price History information.
 * 
 * Uses a customised and styled <Timeline /> that
 * has a dashed line at the end, leading to a button
 * that allows users to add a new price entry. 
 * 
 * Note: `props.updatePriceHistory` is a function 
 * passed in from the parent component <PartViewPage />.
 * It sends a PATCH API call and also a GET API call
 * to update the `part` state in the parent component, 
 * which then causes a re-render of this component since
 * `props.priceHistory` is from the `part` state.
 * Hence, adding new price information through the modal
 * form in <BilboAddPriceInfoButton /> will cause the
 * UI to update, displaying the new price information.
 * 
 * Note: The <BilboAddPriceInfoButton/> will be displayed
 * inline with the <span /> element if no price history
 * information is available.
 */
export default function PriceHistoryTabContent(props) {
    return (
        <>
            <BilboTimelineWithTrailingEnd mode='left'>
                {   props.priceHistory.length === 0
                    ? <span>No price history information available</span>
                    : props.priceHistory.map((price, index) => {
                        let createdAtTime = moment(price.createdAt).format('Do MMM YY, h:mm:ss');
                        return (
                            <BilboTimelineWithTrailingEnd.Item label={createdAtTime} 
                                                 key={index}>
                                <BilboTimelineParagraph>
                                    {price.unitPrice}
                                </BilboTimelineParagraph>
                                <BilboTimelineParagraphDescription>
                                    {price.additionalInfo}
                                </BilboTimelineParagraphDescription>
                                <BilboTimelineParagraphDescription style={{fontStyle: 'italic'}}>
                                    <strong>- {price.createdBy}</strong>
                                </BilboTimelineParagraphDescription>
                            </BilboTimelineWithTrailingEnd.Item>
                        )
                    })
                }
                <Timeline.Item dot={< BilboAddPriceInfoButton updatePriceHistory={props.updatePriceHistory}/>} 
                               style={props.priceHistory.length === 0
                                      ? {display: 'inline', marginLeft: 20}
                                      : {}} />
            </BilboTimelineWithTrailingEnd>
        </>
    )
}
PriceHistoryTabContent.propTypes = {
    priceHistory: PropTypes.array.isRequired,
    updatePriceHistory: PropTypes.func.isRequired,
}

/**
 * Button that displays a modal form for entering
 * new price information for a part. 
 */
function AddPriceInfoButton(props) {
    const { permissionsList } = useAuth();
    const isEnabled = permissionsList.includes(PERMS.PART_WRITE);
    const [form] = Form.useForm();
    const [modalIsVisible, setModalIsVisible] = useState(false);

    const onAddButtonClick = (e) => {
        setModalIsVisible(true);
    }

    // Form Modal Cancel Button is clicked
    const onFormCancel = () => {
        setModalIsVisible(false);
    }

    // Form Modal Confirm Button is clicked
    const onFormConfirm = () => {
        form.validateFields()
            .then(values => {
                form.resetFields();
                props.updatePriceHistory(values)
                     .then(res => {
                        setModalIsVisible(false);
                     }).catch(err => {
                        message.error(`Unable to update Price Information. 
                                       Please check your input!`);
                     })
            })
    }

    return (
        <div style={!isEnabled ? {pointerEvents: 'none', opacity: 0.4} : {}}>
            <Tooltip placement='bottom'
                    title='Add Price Information'>
                <BilboHoverableIconButton 
                    shape='circle'
                    initialcolor={props.theme.colors.lightGrey}
                    transformcolor={props.theme.colors.darkRed}
                    onClick={onAddButtonClick}
                    icon={<PlusCircleOutlined />}>
                </BilboHoverableIconButton>
            </Tooltip>
            <Modal visible={modalIsVisible}
                   title='Add New Price Information'
                   okText='Confirm'
                   onCancel={onFormCancel}
                   onOk={onFormConfirm}>
                <Form form={form}
                      layout='vertical'>
                    <Form.Item name='unitPrice'
                               label='Unit Price'
                               rules={[{required: true, 
                                       message: 'Please provide the unit price'}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name='priceAdditionalInfo'
                               label='Additional Information'>
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
const BilboAddPriceInfoButton = withRouter(withTheme(AddPriceInfoButton));
BilboAddPriceInfoButton.propTypes = {
    updatePriceHistory: PropTypes.func.isRequired,
}


