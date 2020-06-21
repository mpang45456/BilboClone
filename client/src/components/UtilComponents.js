import { Button } from 'antd';
import styled from 'styled-components';

export const DarkInvertedStyledButton = styled(Button)`
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