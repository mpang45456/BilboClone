import React, { useState } from 'react';
import { Button } from 'antd';
import {
    DesktopOutlined,
    PieChartOutlined,
    FileOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Breadcrumb } from 'antd';
const { Header, Content, Sider, Footer } = Layout;
const { SubMenu } = Menu;

// export default function HomePage(props) {
//     return (
//         <div>
//             <Button type='danger'>
//                 This is the Home page
//             </Button>
//         </div>
//     )
// }

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
                <Menu.Item key="1" icon={<PieChartOutlined />}>
                  Option 1
                </Menu.Item>
                <Menu.Item key="2" icon={<DesktopOutlined />}>
                  Option 2
                </Menu.Item>
                <SubMenu key="sub1" icon={<UserOutlined />} title="User">
                  <Menu.Item key="3">Tom</Menu.Item>
                  <Menu.Item key="4">Bill</Menu.Item>
                  <Menu.Item key="5">Alex</Menu.Item>
                </SubMenu>
                <SubMenu key="sub2" icon={<TeamOutlined />} title="Team">
                  <Menu.Item key="6">Team 1</Menu.Item>
                  <Menu.Item key="8">Team 2</Menu.Item>
                </SubMenu>
              </Menu>
            </Sider>
            <Layout className="site-layout">
              <Header className="site-layout-background" style={{ padding: 0 }}> Testing 123</Header>
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

    // render() {
    //     return (
    //         <Layout style={{ minHeight: '100vh'}}>

    //             <Sider collapsible 
    //                    collapsed={this.state.collapsed} 
    //                    onCollapse={this.onCollapse}
    //                    style={{overflow: 'auto', height:'100vh', position:'fixed', left: 0}}>
    //                 <div style={{ height: 32, margin: 16, background: '#FFFFFF' }}></div>
    //                 <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
    //                     <Menu.Item key='1' icon={<PieChartOutlined />}>
    //                         Home
    //                     </Menu.Item>
    //                     <Menu.Item key='2' icon={<DesktopOutlined />}>
    //                         Sales
    //                     </Menu.Item>
    //                     <SubMenu key="sub1" icon={<UserOutlined />} title="User">
    //                         <Menu.Item key="3">Tom</Menu.Item>
    //                         <Menu.Item key="4">Bill</Menu.Item>
    //                         <Menu.Item key="5">Alex</Menu.Item>
    //                     </SubMenu>
    //                     <SubMenu key="sub2" icon={<TeamOutlined />} title="Team">
    //                         <Menu.Item key="6">Team 1</Menu.Item>
    //                         <Menu.Item key="8">Team 2</Menu.Item>
    //                     </SubMenu>
    //                 </Menu>
    //             </Sider>

    //             <Layout>
    //                 <Header style={{padding: 0}}/>
    //                 <Content style={{margin:'0 16px'}}>
    //                     <div style={{ padding: 24, minHeight: 360, background: 'green', textAlign: 'center'}}>
    //                     ...
    //       <br />
    //       Really
    //       <br />
        //   ...
        //   <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       long
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />

    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />

    //       ...
    //       <br />
    //       ...
    //       <br />

    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />

    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />

    //       ...
    //       <br />

    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       ...
    //       <br />
    //       content
    //                     </div>
    //                 </Content>
    //             </Layout>
    //         </Layout>
    //     );
    // }
}
