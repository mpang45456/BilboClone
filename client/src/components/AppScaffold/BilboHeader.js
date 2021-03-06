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
import PropTypes from 'prop-types';

import { bax, useAuth } from '../../context/AuthContext';
import styled from 'styled-components';

// Utility (Styling) Component: Customised div to contain icons
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
HeaderIconButton.propTypes = {
  tooltipTitle: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  iconComponent: PropTypes.element.isRequired
}

function LogOutButton(props) {
  let history = useHistory();
  let { setIsAuthenticated } = useAuth();

  // Renders Confirmation Modal while making
  // async call to /auth/logout to invalidate
  // access and refresh JWTs
  const showLogoutConfirmationModal = () => {
    confirm({
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you wish to log out?',
      onOk: () => {
        return bax.post('/api/v1/auth/logout', { withCredentials : true })
                  .then(res => {
                    if (res.status === 200) {
                      setIsAuthenticated(false);
                      history.push('/login');
                    }
                  }).catch(err => {
                    console.log(err);
                  })
      },
      okText: 'Confirm'
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