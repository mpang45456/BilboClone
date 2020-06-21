import React, { useState } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import {
  HomeOutlined,
  DollarOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Layout, Menu, Breadcrumb } from 'antd';

import HomePage from './HomePage';
import SalesPage from './SalesPage';
import PurchasePage from './PurchasePage';
import ErrorPage from './ErrorPage';

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;



export default class AppScaffold extends React.Component {
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
          <div style={{ height: 32, margin: 16, background: '#FFFFFF' }} />
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
          <Header className="site-layout-background" style={{ padding: 0 }}> Testing 123</Header>

          <Content style={{ margin: '0 16px' }}>
            <Switch>
              <Route exact path='/' component={HomePage} />
              <Route path='/sales' component={SalesPage} />
              <Route path='/purchase' component={PurchasePage} />
              <Route path='/' component={ErrorPage} />
            </Switch>



            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
              hello
                </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}
