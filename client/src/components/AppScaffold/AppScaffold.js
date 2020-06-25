import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Layout } from 'antd';

import BilboSidebar from './BilboSidebar';
import BilboHeader from './BilboHeader';
import BilboContent from './BilboContent';

import HomePage from '../HomePage';
import SalesPage from '../SalesPage';
import PurchasePage from '../PurchasePage';
import InventoryPage from '../InventoryPage';
import SupplierPage from '../SupplierPage';
import SettingsPage from '../SettingsPage';
import CustomerPage from '../CustomerPage';
import ErrorPage from '../ErrorPage';

import CONFIG from '../../config';
import { AuthContext, PERMS } from '../../context/AuthContext';

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
              {
                permissionsList.includes(PERMS.SALES_READ) &&
                <Route path={CONFIG.SALES_ORDERS_URL} component={SalesPage} />
              }
              {
                permissionsList.includes(PERMS.PURCHASES_READ) &&
                <Route path={CONFIG.PURCHASE_ORDERS_URL} component={PurchasePage} />
              }
              {
                permissionsList.includes(PERMS.INVENTORY_READ) &&
                <Route path={CONFIG.INVENTORY_URL} component={InventoryPage} />
              }
              {
                permissionsList.includes(PERMS.SUPPLIER_READ) &&
                <Route path={CONFIG.SUPPLIER_URL} component={SupplierPage} />
              }
              {
                permissionsList.includes(PERMS.CUSTOMER_READ) &&
                <Route path={CONFIG.CUSTOMER_URL} component={CustomerPage} />
              }
              <Route path={CONFIG.SETTINGS_URL} component={SettingsPage} />
              <Route path='*' component={ErrorPage} />
            </Switch>
          </BilboContent>
        </Layout>
      </Layout>
    );
  }
}

AppScaffold.contextType = AuthContext;