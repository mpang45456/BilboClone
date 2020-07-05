import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Timeline, Button } from 'antd';
import { PlusCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboTimeline, 
         BilboTimelineWithTrailingEnd,
         BilboTimelineParagraph, 
         BilboTimelineParagraphDescription } from '../../UtilComponents';
import PropTypes from 'prop-types';
import moment from 'moment';
import styled from 'styled-components';

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
                <Timeline.Item dot={< BilboAddPriceInfoButton />} />
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
        <div onClick={onClickHandler} style={props.style}>
            <PlusCircleOutlined />
        </div>
    )
}
const BilboAddPriceInfoButton = styled(AddPriceInfoButton)`
    background: none;
`;


