import React, { useState } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import {
  HomeOutlined,
  DollarOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Layout, Menu, Row, Col, Tooltip } from 'antd';

import HomePage from './HomePage';
import SalesPage from './SalesPage';
import PurchasePage from './PurchasePage';
import ErrorPage from './ErrorPage';

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

import styled from 'styled-components';

/**
 * Styled <div> element to occupy some space above
 * the sidebar (to match the layout header height)
 */
const SidebarTopSpace = styled.div`
  background: ${props => props.theme.colors.darkerRed};
  height: ${props => props.theme.settings.layoutHeaderHeight};
`;

const IconDiv = styled.div`
  color: ${props => props.theme.colors.salmon};
  background: ${props => props.theme.colors.darkerRed};
  width: ${props => props.theme.settings.layoutHeaderHeight};
  height: ${props => props.theme.settings.layoutHeaderHeight};
  font-size: ${props => props.theme.settings.headerIconFontSize};
  text-align: center;

  &:hover {
    ${'' /* background: ${props => props.theme.colors.darkerRed}; */}
    color: ${props => props.theme.colors.white};
  }
`;

function HeaderIconButton(props) {
  return (
    <Tooltip placement='bottom' title={props.tooltipTitle}>
      <IconDiv onClick={props.onClick}>
        {props.iconComponent}
      </IconDiv>
    </Tooltip>
  );
}

const BilboHeader = styled(Header)`
  padding-right: 0px;
`;

// TODO: Refactor into BilboSider, BilboHeader, BilboContent?
/**
 * Scaffold Component that serves as the point of
 * entry for any authenticated user. The routes 
 * contained within the scaffold determine which
 * pages are being displayed in the content part
 * of the screen. The scaffold also defines the 
 * UI common to all pages in the app (i.e. sidebar,
 * header etc.)
 */
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
          <SidebarTopSpace />
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

        <Layout>
          <BilboHeader>
            <Row justify='end'>
              <HeaderIconButton 
                  tooltipTitle='Logout' 
                  iconComponent={<LogoutOutlined/>}
                  onClick={() => alert('Clicked on logout')}>
              </HeaderIconButton>
              <HeaderIconButton 
                  tooltipTitle='Settings' 
                  iconComponent={<SettingOutlined/>}
                  onClick={() => alert('Clicked on settings')}>
              </HeaderIconButton>
              <HeaderIconButton 
                  tooltipTitle='Notifications' 
                  iconComponent={<BellOutlined/>}
                  onClick={() => alert('Clicked on notifications')}>
              </HeaderIconButton>
            </Row>
          </BilboHeader>
          <Content style={{ margin: '10px 10px', background: 'green', height:'100px', overflowY:'scroll' }}>
            <Switch>
              <Route exact path='/' component={HomePage} />
              <Route path='/sales' component={SalesPage} />
              <Route path='/purchase' component={PurchasePage} />
              <Route path='/' component={ErrorPage} />
            </Switch>

                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />...
                <br />

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>

                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>
                <h1>hello again</h1>

                <h1>hello again</h1>

                <h1>hello again</h1>
          </Content>
        </Layout>
      </Layout>
    );
  }
}
