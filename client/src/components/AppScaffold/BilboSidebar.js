import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
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
        this.__getMenuKeyFromURL = this.__getMenuKeyFromURL.bind(this);
    }

    setIsCollapsed(isCollapsed) {
        this.setState({ isCollapsed });
    }

    /**
     * Gets the first path component in the url.
     * This is so that nested routes still cause 
     * the relevant sidebar menu item to be selected. 
     * 
     * For instance, navigating to /purchases/<purchaseID>
     * will still cause the "Purchase Orders" Menu Item to
     * be selected because the selection is based on 
     * the location's first path component (i.e. `purchases`)
     * 
     * Note: If `url` is '/', then selecting the 1-index 
     * element after a call to `split` will result in an
     * empty string, which will in turn cause nothing in 
     * the menu to be selected. Hence, the default value
     * is '/'
     * 
     * Note: Any path that is not part of the menu items
     * will be ignored (for instance, /settings will still
     * cause `settings` to be chosen as the selectedKey, but
     * since it does not correspond to any menu item's key, 
     * no menu item is selected)
     * @param {String} url 
     */
    __getMenuKeyFromURL(url) {
        return url.split('/')[1] || '/';
    }

    render() {
        // Get current URL location
        const { location } = this.props;

        return (
            <Sider collapsible
              collapsed={this.state.isCollapsed}
              onCollapse={this.setIsCollapsed}
            >
              <SidebarTopSpace />
              <Menu theme='dark' 
                    selectedKeys={[this.__getMenuKeyFromURL(location.pathname)]} 
                    mode="inline">
                <Menu.Item key={CONFIG.HOME_MENU_ITEM_URL} 
                           icon={<HomeOutlined />}>
                  <NavLink to={CONFIG.HOME_MENU_ITEM_URL}>
                    Home
                  </NavLink>
                </Menu.Item>
                <Menu.Item key={this.__getMenuKeyFromURL(CONFIG.SALES_ORDERS_MENU_ITEM_URL)} 
                           icon={<DollarOutlined />} >
                  <NavLink to={CONFIG.SALES_ORDERS_MENU_ITEM_URL}>
                    Sales Orders
                  </NavLink>
                </Menu.Item>
                <Menu.Item key={this.__getMenuKeyFromURL(CONFIG.PURCHASE_ORDERS_MENU_ITEM_URL)} 
                           icon={<ShoppingCartOutlined />} >
                  <NavLink to={CONFIG.PURCHASE_ORDERS_MENU_ITEM_URL}>
                    Purchase Orders
                  </NavLink>
                </Menu.Item>
                <SubMenu key={CONFIG.DATA_SUB_MENU_KEY} 
                         icon={<BarChartOutlined />} 
                         title="Data">
                  <Menu.Item key={this.__getMenuKeyFromURL(CONFIG.INVENTORY_MENU_ITEM_URL)} >
                    <NavLink to={CONFIG.INVENTORY_MENU_ITEM_URL}>
                        Inventory
                    </NavLink>
                  </Menu.Item>
                  <Menu.Item key={this.__getMenuKeyFromURL(CONFIG.SUPPLIER_MENU_ITEM_URL)} >
                    <NavLink to={CONFIG.SUPPLIER_MENU_ITEM_URL}>
                        Suppliers
                    </NavLink>
                  </Menu.Item>
                </SubMenu>
              </Menu>
            </Sider>
        );
    }
}

const BilboSidebar = withRouter(Sidebar);
export default BilboSidebar;