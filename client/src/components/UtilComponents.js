import React from 'react';
import { NavLink } from 'react-router-dom';
import { PageHeader, Dropdown, Button, Spin, Descriptions, Divider } from 'antd';
import { EllipsisOutlined } from "@ant-design/icons";
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
