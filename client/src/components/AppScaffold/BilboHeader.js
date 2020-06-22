import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Drawer, Modal, Layout, Row, Tooltip } from 'antd';
import {
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    ExclamationCircleOutlined
  } from '@ant-design/icons';
const { Header } = Layout;
const { confirm } = Modal;

import { bax, useAuth } from '../../context/AuthContext';
import styled from 'styled-components';

// Utility (Styling) Component: Customised div to contain icons
// TODO: Add custom css on click (down and up)
const IconContainer = styled.div`
  color: ${props => props.theme.colors.salmon};
  background: ${props => props.theme.colors.darkerRed};
  width: ${props => props.theme.settings.layoutHeaderHeight};
  height: ${props => props.theme.settings.layoutHeaderHeight};
  font-size: ${props => props.theme.settings.headerIconFontSize};
  text-align: center;

  &:hover {
    color: ${props => props.theme.colors.white};
  }
`;

// Utility Component: Clickable Button for Header Icons
function HeaderIconButton(props) {
  return (
    <Tooltip placement={props.tooltipPlacement} title={props.tooltipTitle}>
      <IconContainer onClick={props.onClick}>
        {props.iconComponent}
      </IconContainer>
    </Tooltip>
  );
}

function LogOutButton(props) {
  let history = useHistory();
  let { setIsAuthenticated } = useAuth();

  // function showLogoutConfirmationModal() {
  //   const tryLogout = async () => {
  //     await 
  //     bax.post('/auth/logout', { withCredentials: true})
  //         .then(res => {
  //             if (res.status === 200) {
  //                 this.setIsAuthenticated(true);
  //             }
  //         }).catch(err => {
  //             this.setIsAuthenticated(false);
  //         }).then(() => {
  //             this.setIsFetching(false);
  //         })
  //   }
  
  function showLogoutConfirmationModal() {
    confirm({
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you wish to log out?',
      onOk: () => {
        return bax.post('/auth/logout', { withCredentials : true })
                  .then(res => {
                    if (res.status === 200) {
                      setIsAuthenticated(true);
                      history.push('/login');
                      console.log('okay');
                    }
                  }).catch(err => {
                    alert('something went wrong')
                    console.log('something went wrong...')
                  })
      }, 
      onCancel: () => {
        alert('clicked cancel');
      }
    })
  }

  return (
      <HeaderIconButton 
          tooltipPlacement='bottom'
          tooltipTitle='Logout' 
          iconComponent={<LogoutOutlined/>}
          onClick={() => showLogoutConfirmationModal()}>
      </HeaderIconButton>
  );
}


function SettingsButton(props) {
    let history = useHistory();
    const clickedSettings = () => {
        history.push('/settings');
    };

    return(
        <HeaderIconButton 
            tooltipPlacement='bottom'
            tooltipTitle='Settings' 
            iconComponent={<SettingOutlined/>}
            onClick={clickedSettings}>
        </HeaderIconButton>
    );
}

function NotificationsButton(props) {
  const [drawerIsVisible, setDrawerIsVisible] = useState(false);
  const onClick = () => {
    setDrawerIsVisible(true);
  };

  const onClose = () => {
    setDrawerIsVisible(false);
  }

  return (
    <div>
      <HeaderIconButton
          tooltipPlacement='bottomRight'
          tooltipTitle='Notifications' 
          iconComponent={<BellOutlined/>}
          onClick={onClick}>
      </HeaderIconButton>

      <Drawer title='Notifications Panel'
              placement='right'
              closable={false}
              onClose={onClose}
              visible={drawerIsVisible}>
      </Drawer>
    </div>
  );
}

export default function BilboHeader(props) {
    return (
        <Header style={{ paddingRight: 0}}>
            <Row justify='end'>
                <LogOutButton />
                <SettingsButton />
                <NotificationsButton />
            </Row>
        </Header>
    );
}