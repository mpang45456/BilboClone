import React, { useState } from 'react';
import { Button } from 'antd';
import {
    HomeOutlined,
    DollarOutlined,
    BarChartOutlined,
    ShoppingCartOutlined,
    SettingOutlined, 
    LogoutOutlined
} from '@ant-design/icons';
import { Layout, Menu, Breadcrumb } from 'antd';
const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

export default class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false,
        };

        this.onCollapse = this.onCollapse.bind(this);
    }

    onCollapse(collapsed) {
        this.setState({ collapsed });
    }

    render() {
        return (
          <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible 
                   collapsed={this.state.collapsed} 
                   onCollapse={this.onCollapse} 
            >
              <div style={{ height: 32, margin: 16, background: '#FFFFFF'}} />
              <Menu theme='dark' defaultSelectedKeys={['1']} mode="inline">
                <Menu.Item key="1" icon={<HomeOutlined />}>
                  Home
                </Menu.Item>
                <Menu.Item key="2" icon={<DollarOutlined />}>
                  Sales Orders
                </Menu.Item>
                <Menu.Item key="3" icon={<ShoppingCartOutlined />}>
                  Purchase Orders
                </Menu.Item>
                <SubMenu key="sub1" icon={<BarChartOutlined />} title="Statistics">
                  <Menu.Item key="4">Inventory</Menu.Item>
                  <Menu.Item key="5">Progress</Menu.Item>
                </SubMenu>
              </Menu>
            </Sider>
            <Layout className="site-layout">
              <Header className="site-layout-background" style={{ padding: 0, height: 5 }}> Testing 123</Header>
              <Content style={{ margin: '0 16px' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                  <Breadcrumb.Item>User</Breadcrumb.Item>
                  <Breadcrumb.Item>Bill</Breadcrumb.Item>
                </Breadcrumb>
                <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                    hello
                </div>
              </Content>
            </Layout>
          </Layout>
        );
    }
}
