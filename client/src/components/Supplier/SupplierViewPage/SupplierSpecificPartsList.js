import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Table, Tag } from 'antd';
import { bax, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboSearchTable, BilboNavLink } from '../../UtilComponents';
import queryString from 'query-string';
import { escapeRegex } from '../../../utils';
import PropTypes from 'prop-types';

/**
 * Component displaying a table of parts
 * information associated with a particular
 * supplier (as specified by `props.supplierID`)
 */
export default function SupplierSpecificPartsList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, 
                                                  pageSize: CONFIG.DEFAULT_PAGE_SIZE})

    // State for Filter Queries
    const [APIFilterQuery, setAPIFilterQuery] = useState({
        partNumber: '',
        description: '',
        status: '',
        additionalInfo: ''
    })
    const history = useHistory();

    useEffect(() => {
        getPartsData({
            // When a new search filter is used, go back to the first page
            current: 1,
            pageSize: pagination.pageSize,
        });
    }, [APIFilterQuery])

    // Only makes an API call when the table's pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        // Note that `tablePagination` is different from `pagination`
        // `tablePagination`: from `onChange` in <Table />
        // `pagination`: state in this React component
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getPartsData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getPartsData = (pagination) => {
        setIsLoading(true);
        // Send filter in query string
        let filter = JSON.stringify({
            "supplier": props.supplierID,
            "partNumber": { "$regex": escapeRegex(APIFilterQuery.partNumber), "$options": "i"},
            "description": { "$regex": escapeRegex(APIFilterQuery.description), "$options": "i"},
            "status": { "$regex": escapeRegex(APIFilterQuery.status), "$options": "i"},
            "additionalInfo": { "$regex": escapeRegex(APIFilterQuery.additionalInfo), "$options": "i"},
        });
        let query = queryString.stringify({page: pagination.current, 
                                           limit: pagination.pageSize, 
                                           filter});
        bax.get(`/api/v1/part?${query}`, { withCredentials: true })
            .then(res => {
                if (res.status === 200) {
                    setDataSource(res.data.parts);
                    setPagination({
                        current: res.data.currentPage,
                        pageSize: pagination.pageSize,
                        total: res.data.totalPages * pagination.pageSize,
                    })
                    setIsLoading(false);
                }
            }).catch(err => {
                if (err.response.status === 400) {
                    setDataSource([]);
                    setIsLoading(false);
                } else {
                    redirectToErrorPage(err, history);
                }
            })
    }
    
    // Configuration of Columns
    const columns = [
        {
            title: 'Part Number',
            dataIndex: 'partNumber',
            key: 'partNumber',
            width: '15%',
            ...BilboSearchTable.getColumnSearchProps('partNumber', 
                                                     APIFilterQuery, setAPIFilterQuery,
                                                     'part number')
        },
        {
            title: 'Latest Unit Price ($)',
            key: 'priceHistory',
            width: '20%',
            render: (text, record) => {
                if (record.priceHistory[record.priceHistory.length - 1]) {
                    return record.priceHistory[record.priceHistory.length - 1].unitPrice;
                } else {
                    return undefined;
                }
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('description', 
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '25%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo',
                                                     APIFilterQuery, setAPIFilterQuery,
                                                     'info')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            ...BilboSearchTable.getColumnSearchProps('status', 
                                                     APIFilterQuery, setAPIFilterQuery),
            render: status => (
                <Tag color={status==='ACTIVE' ? CONFIG.ACTIVE_TAG_COLOR : CONFIG.ARCHIVED_TAG_COLOR} key={status}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (text, record) => (
                <BilboNavLink to={`${CONFIG.PARTS_URL}/${record._id}`}>
                    view
                </BilboNavLink>
            ),
        },
    ]

    return (
        <Table columns={columns} 
               dataSource={dataSource}
               rowKey={record => record._id}
               loading={isLoading}
               pagination={pagination}
               onChange={handleTableChange}
               bordered
        />
    )
}
SupplierSpecificPartsList.propTypes = {
    supplierID: PropTypes.string.isRequired
}