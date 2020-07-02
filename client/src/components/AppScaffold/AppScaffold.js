import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Layout } from 'antd';

import BilboSidebar from './BilboSidebar';
import BilboHeader from './BilboHeader';
import BilboContent from './BilboContent';

import HomePage from '../HomePage';
import SalesPage from '../SalesPage';
import PurchasePage from '../PurchasePage';
import PartsPage from '../PartsPage';
import SupplierPage from '../SupplierPage';
import SettingsPage from '../SettingsPage';
import CustomerPage from '../CustomerPage';
import UserPage from '../User/UserPage';
import UserViewPage from '../User/UserViewPage';
import UserEditPage from '../User/UserEditPage';
import UserAddPage from '../User/UserAddPage';
import { Error400, Error403, Error404, Error500 } from '../Errors/ErrorPages';

import CONFIG from '../../config';
import { AuthContext } from '../../context/AuthContext';

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
  }

  render() {
    const { permissionsList } = this.context;
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <BilboSidebar />
        <Layout style={{ background: 'gainsboro'}}>
          <BilboHeader />
          <BilboContent>
            <Switch>
              <Route exact path={CONFIG.HOME_URL} component={HomePage} />
              <Route path={CONFIG.SALES_ORDERS_URL} component={SalesPage} />
              <Route path={CONFIG.PURCHASE_ORDERS_URL} component={PurchasePage} />
              <Route path={CONFIG.PARTS_URL} component={PartsPage} />
              <Route path={CONFIG.SUPPLIER_URL} component={SupplierPage} />
              <Route path={CONFIG.CUSTOMER_URL} component={CustomerPage} />
              <Route path={`${CONFIG.USER_URL}add`} component={UserAddPage} />
              <Route path={`${CONFIG.USER_URL}/:username/edit`} component={UserEditPage} />
              <Route path={`${CONFIG.USER_URL}/:username`} component={UserViewPage} />
              <Route path={CONFIG.USER_URL} component={UserPage} />
              <Route path={CONFIG.SETTINGS_URL} component={SettingsPage} />
              <Route path={CONFIG.ERROR_400_URL} component={Error400} />
              <Route path={CONFIG.ERROR_403_URL} component={Error403} />
              <Route path={CONFIG.ERROR_500_URL} component={Error500} />
              <Route path='*' component={Error404} />
            </Switch>
          </BilboContent>
        </Layout>
      </Layout>
    );
  }
}

AppScaffold.contextType = AuthContext;