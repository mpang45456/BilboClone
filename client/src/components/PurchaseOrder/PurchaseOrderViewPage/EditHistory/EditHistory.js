import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboTimeline,
         BilboTimelineParagraph,
         BilboTimelineParagraphDescription,
         BilboDividerWithText } from '../../../UtilComponents';
import { Row, Timeline, Spin } from 'antd';
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../../../../context/AuthContext';
import CONFIG from '../../../../config';
import queryString from 'query-string';
import moment from 'moment';
import { isEmpty } from 'lodash';
import PurchaseOrderMetaDataDisplaySection from '../PurchaseOrderMetaDataDisplaySection';
import PurchaseOrderStateDataDisplaySection from '../PurchaseOrderStateDataDisplaySection';
import { theme } from '../../../Theme';

/**
 * React Component that allows the user to view and
 * navigate the edit history of a purchase order.
 * 
 * Comprised of 2 main parts:
 *    - left-side: navigate edit history with the 
 *      help of a <Timeline/> component
 *    - right-side: view a snapshot of the state
 *      details 
 * 
 * Note: By default, the first state that is displayed
 * is the very first state in the edit history (i.e.
 * the state at index 0)
 */
export default function EditHistory(props) {
    const history = useHistory();
    const [editHistory, setEditHistory] = useState([]);
    const [selectedPurchaseOrderStateIndex, setSelectedPurchaseOrderStateIndex] = useState(0);
    const [selectedPurchaseOrderStateData, setSelectedPurchaseOrderStateData] = useState({});
    const [isLoadingPurchaseOrderStateDetails, setIsLoadingPurchaseOrderStateDetails] = useState(false);

    useEffect(() => {
        // Load Edit History (to populate <Timeline/>)
        const query = queryString.stringify({inc: ['createdAt', 'status', 'updatedBy']});
        bax.get(`/api/v1/purchaseOrder/${props.purchaseOrderMetaData._id}/state?${query}`)
            .then(res => {
                setEditHistory(res.data);
            }).catch(err => {
                redirectToErrorPage(err, history)
            })
        
        // Get State Data (for selected index, initially set to 0,
        // which is guaranteed to exist)
        getPurchaseOrderStateData(selectedPurchaseOrderStateIndex);
    }, []) // Only run once on component mount

    // Get State Data for display (on right-hand side)
    const getPurchaseOrderStateData = (index) => {
        (async function() {
            // Get State Data
            let stateData = null;
            const query = queryString.stringify({ populateFulfilledFor: true });
            await bax.get(`/api/v1/purchaseOrder/${props.purchaseOrderMetaData._id}/state/${index}?${query}`)
                .then(res => {
                    if (res.status === 200) {
                        stateData = res.data;
                    }
                }).catch(err => {
                    redirectToErrorPage(err, history);
                })
    
            // Populate State Data with Part's Part Number and Supplier Name
            await Promise.all(stateData.parts.map(async part => {
                const query = queryString.stringify({inc: ['partNumber'], supplierPopulate: ['name']});
                await bax.get(`/api/v1/part/${part.part}?${query}`)
                         .then(res => {
                             part.partNumber = `${res.data.partNumber} (${res.data.supplier.name})`;
                         })
            })).then(_ => {
                setSelectedPurchaseOrderStateData(stateData);
                setIsLoadingPurchaseOrderStateDetails(false);
            }).catch(err => {
                setIsLoadingPurchaseOrderStateDetails(false);
                redirectToErrorPage(err, history);
            })
        })();
    }

    // Change the selected state index and retrieve new data
    const onTimelineItemClick = (index) => {
        setSelectedPurchaseOrderStateIndex(index);
        getPurchaseOrderStateData(index);
    }

    return (
        <Row>
            {/* Navigate History of Changes (Left-Side) */}
            <div style={{width: '30%', 
                         display: 'inline', 
                         paddingRight: '20px', 
                         borderRight: `2px solid ${theme.colors.deepRed}`
                        }}
            >
                <BilboDividerWithText orientation='left'>History of Changes</BilboDividerWithText>
                <BilboTimeline mode='left'>
                    {
                        editHistory.map((editHistoryInstance, index) => {
                            let createdAtTime = moment(editHistoryInstance.createdAt).format('Do MMM YY, h:mm:ss');
                            return (
                                <Timeline.Item label={createdAtTime} 
                                               key={index} 
                                               onClick={() => onTimelineItemClick(index)}
                                               color={index === selectedPurchaseOrderStateIndex ? 'blue' : 'gray' }
                                >
                                    <BilboTimelineParagraph>
                                        {`Status: ${CONFIG.PURCHASE_ORDER_STEPS[CONFIG.PURCHASE_ORDER_STEPS.findIndex(statusObj => statusObj.status === editHistoryInstance.status)].title}`}
                                    </BilboTimelineParagraph>
                                    <BilboTimelineParagraphDescription style={{fontStyle: 'italic'}}>
                                        <strong>- {editHistoryInstance.updatedBy}</strong>
                                    </BilboTimelineParagraphDescription>
                                </Timeline.Item>
                            )
                        })
                    }
                </BilboTimeline>
            </div>
            {/* Display State Data Snapshot (Right-Side) */}
            <div style={{width: '70%', display: 'inline', paddingLeft: '20px'}}>
                <PurchaseOrderMetaDataDisplaySection 
                    purchaseOrderMetaData={props.purchaseOrderMetaData}
                />
                {
                    isEmpty(selectedPurchaseOrderStateData)
                    ? <Spin spinning={isLoadingPurchaseOrderStateDetails} />
                    : <PurchaseOrderStateDataDisplaySection 
                        purchaseOrderStateData={selectedPurchaseOrderStateData}
                      />
                }
            </div>
        </Row>
    )
}
EditHistory.propTypes = {
    purchaseOrderMetaData: PropTypes.object.isRequired,
}