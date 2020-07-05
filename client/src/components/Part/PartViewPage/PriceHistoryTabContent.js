import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Timeline } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { bax, useAuth, redirectToErrorPage, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboTimeline, 
         BilboTimelineParagraph, 
         BilboTimelineParagraphDescription } from '../../UtilComponents';
import PropTypes from 'prop-types';
import moment from 'moment';

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
            : (<BilboTimeline mode='left'>
                {
                    props.priceHistory.map((price, index) => {
                        let createdAtTime = moment(price.createdAt).format('Do MMM YY, h:mm:ss');
                        return (
                            <BilboTimeline.Item label={createdAtTime} 
                                                 key={index}>
                                <BilboTimelineParagraph>
                                    {price.unitPrice}
                                </BilboTimelineParagraph>
                                <BilboTimelineParagraphDescription>
                                    {price.additionalInfo}
                                </BilboTimelineParagraphDescription>
                            </BilboTimeline.Item>
                        )
                    })
                }
            </BilboTimeline>)
        }
        </>
    )
}

PriceHistoryTabContent.propTypes = {
    priceHistory: PropTypes.array.isRequired,
}
