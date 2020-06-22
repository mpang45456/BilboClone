import { Layout } from 'antd';
const { Content } = Layout;

import styled from 'styled-components';

const BilboContent = styled(Content)`
    margin: 10px 10px; 
    padding: 10px 10px;
    background: ${props => props.theme.colors.marble};; 
    height: 100px; 
    overflow-y: scroll;
`;

export default BilboContent;