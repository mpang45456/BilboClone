import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShowMoreButton, 
         BilboPageHeader, 
         BilboDivider, 
         BilboSearchTable, 
         BilboNavLink } from '../UtilComponents';
import { Menu, Table, Tag } from 'antd';
import { PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { bax, useAuth, PERMS, redirectToErrorPage } from '../../context/AuthContext';
import CONFIG from '../../config';
import { escapeRegex } from '../../utils';
import queryString from 'query-string';

/**
 * Component displaying a list of all parts.
 * Made up of 3 main components:
 * 1. BilboPageHeader
 *    - Title
 *    - Show more button (Add a Part)
 * 2. BilboDivider
 * 3. PartList
 */
export default function PartPage(props) {
    const { permissionsList } = useAuth();
    return (
        <>
            <BilboPageHeader 
                title='All Parts'
                subTitle='List of All Parts'
                extra={[
                    <AllPartsShowMoreButton 
                        key='allPartsShowMoreButton'
                        disabled={!permissionsList.includes(PERMS.PART_WRITE)}
                    />
                ]}
            />

            <BilboDivider />

            <PartList />
        </>
    )
}

/**
 * `showMoreButton` for the <PartPage />
 * Dropdown contains a button to add a part. 
 */
function AllPartsShowMoreButton(props) {
    const history = useHistory();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addPartItem') {
            history.push(`${CONFIG.PARTS_URL}add`);
        }
    }
    const menu = (
        <Menu onClick={buttonClicked}>
            <Menu.Item
                key='addPartItem'
                icon={<PlusOutlined />}>
                Add a Part
            </Menu.Item>
        </Menu>
    )

    return (
        <ShowMoreButton
            dropdownKey='allPartsShowMoreButton'
            menu={menu}
            disabled={props.disabled}
        />
    )
}
AllPartsShowMoreButton.propTypes = {
    disabled: PropTypes.bool.isRequired
}

/**
 * Component displaying the list of parts.
 * 
 * Note: `partNumber`, `description`, `status`
 * and `additionalInfo` are all searchable in the
 * table. However, `supplier.name` is not searchable, 
 * even after populating the field value through the
 * POST API call. This is because the API currently
 * does not support filtering by the populate field. 
 * To find parts associated with a particular supplier,
 * go to the Suppliers page instead and search there. 
 */
function PartList(props) {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({current: 1, 
                                                  pageSize: CONFIG.DEFAULT_PAGE_SIZE})

    // State for Filter Queries (Searchable in Table)
    const [APIFilterQuery, setAPIFilterQuery] = useState({
        partNumber: '',
        description: '',
        status: '',
        additionalInfo: '',
    });
    const history = useHistory();

    useEffect(() => {
        getPartData({
            // When a new search filter is used, go back to the first page
            current: 1,
            pageSize: pagination.pageSize,
        });
    }, [APIFilterQuery]);

    // Only makes an API call when the table's pagination settings change
    const handleTableChange = (tablePagination, filters, sorter) => {
        // Note that `tablePagination` is different from `pagination`
        // `tablePagination`: from `onChange` in <Table />
        // `pagination`: state in this React component
        if ((tablePagination.current !== pagination.current) || 
            (tablePagination.pageSize !== pagination.pageSize)) {
            getPartData(tablePagination);
        }
    }

    // API call to obtain supplier data
    const getPartData = (pagination) => {
        setIsLoading(true);
        // Send filter in query string
        let filter = JSON.stringify({
            "partNumber": { "$regex": escapeRegex(APIFilterQuery.partNumber), "$options": "i"},
            "description": { "$regex": escapeRegex(APIFilterQuery.description), "$options": "i"},
            "status": { "$regex": escapeRegex(APIFilterQuery.status), "$options": "i"},
            "additionalInfo": { "$regex": escapeRegex(APIFilterQuery.additionalInfo), "$options": "i"},
        });
        let query = queryString.stringify({page: pagination.current, 
                                           limit: pagination.pageSize,
                                           supplierPopulate: 'name', // populate supplier `name` field
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
            title: 'Supplier Name',
            key: 'name',
            width: '15%',
            render: (text, record) => {
                return record.supplier.name;
            }
        },
        {
            title: 'Part Number',
            dataIndex: 'partNumber',
            key: 'partNumber',
            width: '15%',
            ...BilboSearchTable.getColumnSearchProps('partNumber', 
                                                     APIFilterQuery, setAPIFilterQuery)
        },
        {
            title: 'Latest Unit Price ($)',
            key: 'priceHistory',
            width: '10%',
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
            title: 'Additional Information',
            dataIndex: 'additionalInfo',
            key: 'additionalInfo',
            width: '20%',
            ...BilboSearchTable.getColumnSearchProps('additionalInfo', 
                                                     APIFilterQuery, setAPIFilterQuery)
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