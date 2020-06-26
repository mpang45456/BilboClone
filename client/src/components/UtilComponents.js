import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Dropdown, Button } from 'antd';
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
export const BilboNavLink = styled(Link)`
    &:hover {
        text-decoration: underline;
    }
`;