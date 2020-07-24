import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BilboDividerWithText } from './UtilComponents';
import { Statistic, Card, Col, Row, Table } from 'antd';
import PropTypes from 'prop-types';
import { bax, redirectToErrorPage } from '../context/AuthContext';

export default function HomePage(props) {
    const history = useHistory();
    const [statistics, setStatistics] = useState({});
    
    useEffect(() => {
        getStatistics();
    }, []);

    const getStatistics = () => {
        bax.get(`/api/v1/statistic`)
            .then(res => {
                setStatistics(res.data);
            }).catch(err => {
                redirectToErrorPage(err, history)
            })
    }

    return (
        <>
            <h1>Welcome To Bilbo</h1>
            
            <BilboDividerWithText orientation='left'>User Statistics</BilboDividerWithText>
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
            <Card title={props.userStatistics.name}
            >
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
                {/* Statistics Breakdown (Sales Order) */}
                {
                    props.userStatistics.salesOrders.length !== 0
                    ? <div>
                        <BilboDividerWithText orientation='left'>
                            Sales Order Breakdown
                        </BilboDividerWithText>
                        <OrderBreakDown allOrders={props.userStatistics.salesOrders} />
                    </div>
                    : null
                }
                {/* Statistics Breakdown (Purchase Order) */}
                {
                    props.userStatistics.purchaseOrders.length !== 0
                    ? <div>
                        <BilboDividerWithText orientation='left'>
                            Purchase Order Breakdown
                        </BilboDividerWithText>
                        <OrderBreakDown allOrders={props.userStatistics.purchaseOrders} />
                    </div>
                    : null
                }


            </Card>
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
            title: 'Value',
            dataIndex: 'totalValue',
            key: 'totalValue',
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