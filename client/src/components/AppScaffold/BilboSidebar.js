import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Menu } from 'antd';
import {
    HomeOutlined,
    DollarOutlined,
    BarChartOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';
const { Sider } = Layout;
const { SubMenu } = Menu;
import styled from 'styled-components';

import CONFIG from '../../config';

/**
 * Styled <div> element to occupy some space above
 * the sidebar (to match the layout header height)
 */
const SidebarTopSpace = styled.div`
  background: ${props => props.theme.colors.darkerRed};
  height: ${props => props.theme.settings.layoutHeaderHeight};
`;

class Sidebar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isCollapsed: false,
        }
        this.setIsCollapsed = this.setIsCollapsed.bind(this);
        this.menuClicked = this.menuClicked.bind(this);
    }

    setIsCollapsed(isCollapsed) {
        this.setState({ isCollapsed });
    }

    menuClicked({ item, key, keyPath, domEvent }) {
        // `props.history` provided by `withRouter` wrapper
        // `withRouter` wraps `Sidebar` to give `BilboSidebar`
        this.props.history.push(item.props.url);
    }

    render() {
        return (
            <Sider collapsible
              collapsed={this.state.isCollapsed}
              onCollapse={this.setIsCollapsed}
            >
              <SidebarTopSpace />
              <Menu theme='dark' 
                    defaultSelectedKeys={[CONFIG.HOME_MENU_ITEM_KEY]} 
                    mode="inline"
                    onClick={this.menuClicked}>
                <Menu.Item key={CONFIG.HOME_MENU_ITEM_KEY} 
                           icon={<HomeOutlined />} 
                           url={'/'}>
                  Home
                </Menu.Item>
                <Menu.Item key={CONFIG.SALES_ORDERS_MENU_ITEM_KEY} 
                           icon={<DollarOutlined />} 
                           url={'/sales'}>
                  Sales Orders
                </Menu.Item>
                <Menu.Item key={CONFIG.PURCHASE_ORDERS_MENU_ITEM_KEY} 
                           icon={<ShoppingCartOutlined />} 
                           url={'/purchases'}>
                  Purchase Orders
                </Menu.Item>
                <SubMenu key={CONFIG.DATA_SUB_MENU_KEY} 
                         icon={<BarChartOutlined />} 
                         title="Data">
                  <Menu.Item key={CONFIG.INVENTORY_MENU_ITEM_KEY} 
                             url={'/inventory'}>
                    Inventory
                  </Menu.Item>
                  <Menu.Item key={CONFIG.SUPPLIER_MENU_ITEM_KEY} 
                             url={'/suppliers'}>
                    Suppliers
                  </Menu.Item>
                </SubMenu>
              </Menu>
            </Sider>
        );
    }
}

const BilboSidebar = withRouter(Sidebar);
export default BilboSidebar;