import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PageHeader, Row, Dropdown, Button, Spin, Descriptions, Divider, Input, message } from 'antd';
import { EllipsisOutlined, SearchOutlined, CloseCircleOutlined, CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import Highlighter from 'react-highlight-words';
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
        padding: 5px 16px;
        lineHeight: 2.0;
    }

    & .ant-descriptions-item-content {
        padding: 5px 16px;
        lineHeight: 2.0;
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
    getColumnSearchProps: (dataIndex, APIFilterQuery, setAPIFilterQuery) => {
        // To obtain a reference to the <Input /> and `select` when the dropdown appears
        let inputNode = null;

        // Boolean to determine if the column is being filtered via search terms
        let isBeingFilered = false;

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
            filterIcon: (filtered) => {
                isBeingFilered = filtered;
                return (
                    <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
                )
            },
            // When the filter dropdown appears, focus on the `inputNode`
            // (so the user can begin typing immediately)
            onFilterDropdownVisibleChange: (visible) => {
                if (visible) {
                    setTimeout(() => {
                        inputNode.select();
                    })
                }
            },
            // Add text highlighting
            render: (text) => {
                if (isBeingFilered) {
                    return (
                        <Highlighter highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                                     searchWords={[APIFilterQuery]}
                                     autoEscape
                                     textToHighlight={text.toString()}/>
                    )
                } else {
                    return text;
                }
            }
        }
    }
}

/**
 * React Component to display a value, while
 * giving the user to option to click on edit
 * to begin editing details. 
 * 
 * After editing, the user can then cancel or 
 * save the changes made. What happens when the 
 * changes are saved is entirely dependent on the
 * `update` function passed through the props. 
 * 
 * In the case of `SupplierViewPage`, this triggers
 * an API PATCH method call to update the fields
 * of the Supplier.
 */
export function EditableItem(props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editItemValue, setEditItemValue] = useState(props.value);

    const onSave = () => {
        props.update(editItemValue)
             .then(res => setIsEditing(false))
             .catch(err => {
                 redirectToErrorPage(err) // TODO: Update with proper UI error handling (wrt <Input />)
             })
    }
    
    const textAreaAutoSizeConfig = { minRows: 3, maxRows: 10 };

    // React Component to Display While Editing
    const isEditingItem = (
        <div style={{display: 'inline'}}>
            {
                props.isTextArea
                ? <Input.TextArea defaultValue={props.value}
                                  onChange={e => setEditItemValue(e.target.value)} 
                                  style={{width: '70%'}}
                                  autoSize={textAreaAutoSizeConfig}
                  />
                : <Input defaultValue={props.value}
                   onChange={e => setEditItemValue(e.target.value)} 
                   style={{width: '70%'}}
                  />
            }
            <EditableItemStyledIconButton onClick={() => {
                        setEditItemValue(props.value);
                        setIsEditing(false);
                    }}
                    transformcolor='#c93623'
                    icon={<CloseCircleOutlined />}
            >
            </EditableItemStyledIconButton>
            <EditableItemStyledIconButton onClick={onSave}
                    transformcolor='#52c41a'
                    icon={<CheckCircleOutlined />}
            >
            </EditableItemStyledIconButton>
        </div>
    )

    // React Component to Display While Viewing
    const notIsEditingItem = (
        <Row>
            {
                props.isTextArea
                ? <Input.TextArea value={props.value}
                                  style={{width: '70%'}}
                                  readOnly
                                  autoSize={textAreaAutoSizeConfig}
                  />
                : <span style={{width: '70%'}}>
                      {props.value}
                  </span>
            }
            <Button onClick={() => { setIsEditing(true); }}
                    icon={<EditOutlined />} 
                    style={{background: 'none', border: 'none', boxShadow: 'none'}}
                    disabled={!props.isEditingEnabled}
                >
                Edit
            </Button>
        </Row>
    )

    return (
        <div>
            {
                isEditing 
                ? isEditingItem
                : notIsEditingItem
            }
        </div>
    )
}
EditableItem.propTypes = {
    // Whether an <Input /> or <Input.TextArea /> is displayed
    isTextArea: PropTypes.bool.isRequired,
    // The value to be displayed
    value: PropTypes.string,
    // Function to call when value change is confirmed (`save` is invoked)
    update: PropTypes.func.isRequired,
    // Whether editing should be enabled in `EditableItem` (based on permissions check)
    isEditingEnabled: PropTypes.bool.isRequired,
}
EditableItem.defaultProps = {
    isTextArea: false
}

// For `Cancel`/`Save` Icon Button when Editing
// `transformColor` is the color of the icon upon mouse hover
const EditableItemStyledIconButton = styled(Button)`
    background: none;
    border: none; 
    box-shadow: none;

    &:hover {
        transform: scale(1.2);
        background: none;
        color: ${props => props.transformcolor}
    }
`
EditableItemStyledIconButton.propTypes = {
    transformcolor: PropTypes.string.isRequired
}
