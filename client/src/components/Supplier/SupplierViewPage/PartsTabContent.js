import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Table, Tag } from 'antd';
import { bax, redirectToErrorPage } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { BilboSearchTable, BilboNavLink } from '../../UtilComponents';
import queryString from 'query-string';
import PropTypes from 'prop-types';

/**
 * Container component housing all the content
 * related to the Parts tab.
 */
export default function PartsTabContent(props) {
    return (
        <>
            <SupplierSpecificPartsList supplierid={props.supplierid}/>
        </>
    )
}
PartsTabContent.propTypes = {
    // For <SupplierSpecificPartsList />
    supplierid: PropTypes.string.isRequired
}

/**
 * Component displaying a table of parts
 * information associated with a particular
 * supplier (as specified by `props.supplierid`)
 */
function SupplierSpecificPartsList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, pageSize: 10}) // TODO: Abstract this into CONFIG after completion

    // State for Filter Queries
    const [partNumberFilterQuery, setPartNumberFilterQuery] = useState('');
    const [descriptionFilterQuery, setDescriptionFilterQuery] = useState('');
    const [statusFilterQuery, setStatusFilterQuery] = useState('');
    const [additionalInfoFilterQuery, setAdditionalInfoFilterQuery] = useState('');
    const history = useHistory();

    useEffect(() => {
        getPartsData(pagination);
    }, [partNumberFilterQuery, descriptionFilterQuery, statusFilterQuery, additionalInfoFilterQuery])

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
            "supplier": props.supplierid,
            "partNumber": { "$regex": partNumberFilterQuery, "$options": "i"},
            "description": { "$regex": descriptionFilterQuery, "$options": "i"},
            "status": { "$regex": statusFilterQuery, "$options": "i"},
            "additionalInfo": { "$regex": additionalInfoFilterQuery, "$options": "i"},
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
            ...BilboSearchTable.getColumnSearchProps('partNumber', partNumberFilterQuery, setPartNumberFilterQuery)
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
            ...BilboSearchTable.getColumnSearchProps('description', descriptionFilterQuery, setDescriptionFilterQuery)
        },
        {
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '25%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo', additionalInfoFilterQuery, setAdditionalInfoFilterQuery)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            ...BilboSearchTable.getColumnSearchProps('status', statusFilterQuery, setStatusFilterQuery),
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
    supplierid: PropTypes.string.isRequired
}