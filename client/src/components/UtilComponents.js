import React from 'react';
import { NavLink } from 'react-router-dom';
import { PageHeader, Dropdown, Button, Spin, Descriptions, Divider, Input } from 'antd';
import { EllipsisOutlined, SearchOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * Customises the regular <button> HTML element, 
 * not the antd Button.
 */
export const DarkInvertedStyledButton = styled.button`
    color: ${props => props.theme.colors.deepRed };
    font-size: 1em;
    padding: 0.25em 1em;
    border: 2px solid ${props => props.theme.colors.deepRed };
    border-radius: 3px;
    display: block;

    &.ant-btn {
        background: ${props => props.theme.colors.marble };
    }

    &.ant-btn:hover {
        color: ${props => props.theme.colors.marble };
        background: ${props => props.theme.colors.deepRed };
        border: 2px solid ${props => props.theme.colors.deepRed };
    }
`;

/**
 * A UI Component with 3 ellipses for a button. 
 * It provides a Dropdown Menu, with a customisable menu.
 */
export function ShowMoreButton(props) {
    return (
        <Dropdown key={props.dropdownKey} 
                  overlay={props.menu}
                  trigger='click'
                  disabled={props.disabled} >
            <Button style={{ border: 'none', 
                             backgroundColor: 'transparent',
                             boxShadow: 'none' }}>
                <EllipsisOutlined style={{
                    fontSize: 20
                }} />
            </Button>
        </Dropdown>
    );
}
ShowMoreButton.propTypes = {
    dropdownKey: PropTypes.string.isRequired,
    menu: PropTypes.element.isRequired,
    disabled: PropTypes.bool.isRequired
}

// Styled PageHeader
export const BilboPageHeader = styled(PageHeader)`
    padding: 0px;
`;

// Styled Link
export const BilboNavLink = styled(NavLink)`
    &:hover {
        text-decoration: underline;
    }
`;

const StyledSpin = styled(Spin)`
    position: absolute;
    left: 50%;
    top: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
`;

// Whole-Page Loading Spinner (for when app first starts)
export function BilboLoadingSpinner(props) {
    return <StyledSpin size='large' {...props}/>
}

// Styled Descriptions
export const BilboDescriptions = styled(Descriptions)`
    & .ant-descriptions-item-label {
        width: 150px;
        border-right: 2px solid ${props => props.theme.colors.deepRed };
    }
`;

// Styled Divider
export const BilboDivider = styled(Divider)`
    &.ant-divider {
        border-top: 1px solid ${props => props.theme.colors.lightGrey };
    }
`;

// Utilities associated with a Search Table
export const BilboSearchTable = {
    getColumnSearchProps: (dataIndex, setAPIFilterQuery) => {
        // To obtain a reference to the <Input /> and `select` when the dropdown appears
        let inputNode = null;

        return {
            /**
             * The dropdown search filter UI
             * 
             * Note: `selectedKeys` must be an array
             * 
             * Note: `selectedKeys` and setSelectedKeys` are only
             * used internally by the dropdown. To actually
             * change the filer value, call `setAPIFilterQuery` 
             * with the new filter value. 
             * 
             * Note: The code in this function will only
             * call `setAPIFilterQuery`, but it is up 
             * to the parent component to decide what to
             * do when the `APIFilterQuery` has been set.
             * Typically, `useEffect()` should be applied
             * whenever the `APIFilterQuery` changes value.
             * 
             * Note: `confirm` closes the dropdown menu
             * and makes the search icon change to the 
             * colour when it is `filtered`
             * 
             * Note: On the flip side, `clearFilters` closes
             * the dropdown menu and makes the search icon
             * change to the colour when it is not `filtered`
             */
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                return (
                    <div style={{padding: 5}}>
                        <Input placeholder={`Search ${dataIndex}`}
                            ref={node => { inputNode = node; }}
                            value={selectedKeys[0]}
                            onChange={e => {
                                // When `e.target.value` is an empty string,
                                // it is equivalent to no filtering
                                setSelectedKeys(e.target.value ? [e.target.value] : [''])
                            }}
                            onPressEnter={() => {
                                confirm();
                                // ternary expression ensures that selected keys is always defined
                                // regardless of when async call to `setSelectedKeys` completes
                                setAPIFilterQuery(selectedKeys[0] ? selectedKeys[0]: '');
                            }}
                            style={{width: 200, marginBottom: 5, display: 'block'}}
                        />
                        <Button type='primary'
                                onClick={() => {
                                    confirm();
                                    // ternary expression ensures that selected keys is always defined
                                    // regardless of when async call to `setSelectedKeys` completes
                                    setAPIFilterQuery(selectedKeys[0] ? selectedKeys[0]: '');
                                }}
                                icon={<SearchOutlined />}
                                style={{width: 100, marginRight: 5}}
                                size='small'>
                            Search
                        </Button>
                        <Button onClick={() => {
                                    clearFilters();
                                    setSelectedKeys(['']);
                                    setAPIFilterQuery('');
                                }}
                                style={{width: 95}}
                                size='small'>
                            Clear
                        </Button>
                    </div>
                )
            },
            // Sets Filter Icon appearance (depending on whether `filtered` or not)
            filterIcon: filtered => {
                return (
                    <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
                )
            },
            // When the filter dropdown appears, focus on the `inputNode`
            // (so the user can begin typing immediately)
            onFilterDropdownVisibleChange: visible => {
                if (visible) {
                    setTimeout(() => {
                        inputNode.select();
                    })
                }
            }
        }
    }
}
