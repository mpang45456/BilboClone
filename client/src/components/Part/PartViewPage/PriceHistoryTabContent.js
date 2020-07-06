import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Timeline, Button } from 'antd';
import { PlusCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboTimeline, 
         BilboTimelineWithTrailingEnd,
         BilboTimelineParagraph, 
         BilboTimelineParagraphDescription,
         BilboHoverableIconButton } from '../../UtilComponents';
import PropTypes from 'prop-types';
import moment from 'moment';
import styled, { withTheme } from 'styled-components';

/**
 * Timeline component displaying the price 
 * history of a part. 
 */
export default function PriceHistoryTabContent(props) {
    return (
        <>
        {
            props.priceHistory.length === 0
            ? <span>No price history information available</span>
            : (<BilboTimelineWithTrailingEnd mode='left'>
                {
                    props.priceHistory.map((price, index) => {
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
                <Timeline.Item dot={< BilboAddPriceInfoButton />} style={{background: 'none'}}/>
            </BilboTimelineWithTrailingEnd>)
        }
        </>
    )
}
PriceHistoryTabContent.propTypes = {
    priceHistory: PropTypes.array.isRequired,
}

function AddPriceInfoButton(props) {
    const onClickHandler = (e) => {
        console.log('TO BE IMPLEMENTED'); // TODO: Implement
    }


    return (
        <BilboHoverableIconButton 
            shape='circle'
            initialcolor={props.theme.colors.lightGrey}
            transformcolor={props.theme.colors.darkRed}
            icon={<PlusCircleOutlined />}>
            
        </BilboHoverableIconButton>
    )
}
const BilboAddPriceInfoButton = withTheme(AddPriceInfoButton);


