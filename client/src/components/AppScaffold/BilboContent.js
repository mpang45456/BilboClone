import { Layout } from 'antd';
const { Content } = Layout;
import styled from 'styled-components';

// Styling for Content Component in AppScaffolding
const BilboContent = styled(Content)`
    margin: 10px 10px; 
    padding: 20px 20px;
    background: ${props => props.theme.colors.marble};; 
    height: 100px; 
    overflow-y: scroll;
`;

export default BilboContent;