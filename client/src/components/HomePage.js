import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText, 
         BilboDivider,
         BilboPageHeader, 
         BilboCollapse,
         BilboCard } from './UtilComponents';
import { Statistic, Collapse, Col, Row, Table, DatePicker, Form, Button } from 'antd';
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../context/AuthContext';
import moment from 'moment';
import queryString from 'query-string';

/**
 * React Component that Renders the welcome page 
 * of the application. 
 * 
 * This page is also responsible for displaying
 * all sales and purchase order statistics associated
 * with a particular user and his/her user hierarchy. 
 * 
 * A Date <RangePicker /> enables users to specify
 * a range of dates for which the statistics for
 * the sales/purchase orders are compiled. The
 * statistics for each user are displayed in a 
 * separate <UserStatisticsCard/>
 * 
 * The default date range on first render is one 
 * month before the current date.
 */
export default function HomePage(props) {
    const history = useHistory();
    const [statistics, setStatistics] = useState({});

    // Default Date Range: 1 month before current date
    const defaultTimeStart = moment().set({hour: 0, minute: 0, second: 0, millsecond: 0})
                                     .add(-1, 'months');
    const defaultTimeEnd = moment().set({hour: 23, minute: 59, second: 59, millsecond: 999});
    
    useEffect(() => {
        getStatistics(defaultTimeStart.toISOString(), 
                      defaultTimeEnd.toISOString());
    }, []);

    const getStatistics = (timeStart, timeEnd) => {
        const query = queryString.stringify({timeStart, timeEnd})
        bax.get(`/api/v1/statistic?${query}`)
            .then(res => {
                setStatistics(res.data);
            }).catch(err => {
                redirectToErrorPage(err, history)
            })
    }

    const onFinish = (values) => {
        const timeStart = values.dateRange[0]
                                .set({hour: 0, minute: 0, second: 0, millsecond: 0})
                                .toISOString();
        const timeEnd = values.dateRange[1]
                              .set({hour: 23, minute: 59, second: 59, millsecond: 999})
                              .toISOString();
        getStatistics(timeStart, timeEnd);
    }

    return (
        <>
            <BilboPageHeader 
                title='Home Page'
            />
            
            <BilboDividerWithText orientation='left'>User Statistics</BilboDividerWithText>
            
            {/* Data Range Picker */}
            <Form onFinish={onFinish}>
                <Row>
                    <Form.Item name='dateRange' label='Pick a date range'>
                        <RangePicker defaultValue={[defaultTimeStart, defaultTimeEnd]}/>
                    </Form.Item>
                    <Form.Item>
                        <Button htmlType='submit'>
                            Submit
                        </Button> 
                    </Form.Item>
                </Row>
            </Form>
            
            {/* User Statistics Cards */}
            <div>
                <Row>
                    {
                        Object.keys(statistics).map(key => {
                            return <UserStatisticsCard 
                                        userStatistics={statistics[key]}
                                        key={key}
                                    />
                        })
                    }
                </Row>
            </div>
        </>
    );
}

/**
 * React Component to render the statistics of 
 * a single user in a <Card/> component.
 */
function UserStatisticsCard(props) {
    let reducer = (acc, currVal) => acc + currVal.totalValue;
    let totalSalesOrderValue = props.userStatistics.salesOrders.reduce(reducer, 0);
    let totalPurchaseOrderValue = props.userStatistics.purchaseOrders.reduce(reducer, 0);

    return (
        <Col span={12}>
            <BilboCard title={props.userStatistics.name} >
                {/* Aggregate Statistics */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic title='Total Sales Order Value'
                                   value={totalSalesOrderValue}
                                   prefix='$'
                                   precision={2}
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic title='Total Purchase Order Value'
                                   value={totalPurchaseOrderValue}
                                   prefix='$'
                                   precision={2}
                        />
                    </Col>
                </Row>

                {/* Statistics Breakdown (Sales and Purchase Orders) */}
                <BilboDivider />
                <BilboCollapse ghost={true} style={{}}>
                    <Panel header='Sales Order Breakdown'> 
                        <OrderBreakDown allOrders={props.userStatistics.salesOrders} />
                    </Panel>
                    <Panel header='Purchase Order Breakdown'> 
                        <OrderBreakDown allOrders={props.userStatistics.purchaseOrders} />
                    </Panel>
                </BilboCollapse>
            </BilboCard>
        </Col>

    )
}
UserStatisticsCard.propTypes = {
    userStatistics: PropTypes.object.isRequired,
}

/**
 * Renders a table that provides a breakdown
 * of the various orders (sales/purchase orders)
 * and their individual monetary value.
 */
function OrderBreakDown(props) {
    const columns = [
        {
            title: 'Order Number',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
        },
        {
            title: 'Value ($)',
            dataIndex: 'totalValue',
            key: 'totalValue',
            render: value => value.toFixed(2) //Set 2 decimal places
        }
    ]
    return (
        <Table columns={columns}
               dataSource={props.allOrders}
               rowKey='orderNumber'
               pagination={false} 
        />
    )
}
OrderBreakDown.propTypes = {
    allOrders: PropTypes.array.isRequired,
}