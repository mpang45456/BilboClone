import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Layout } from 'antd';

import BilboSidebar from './BilboSidebar';
import BilboHeader from './BilboHeader';
import BilboContent from './BilboContent';

import HomePage from '../HomePage';
import SalesOrderPage from '../SalesOrder/SalesOrderPage';
import SalesOrderViewPage from '../SalesOrder/SalesOrderViewPage/SalesOrderViewPage';
import SalesOrderAddPage from '../SalesOrder/SalesOrderAddPage';
import PurchaseOrderPage from '../PurchaseOrder/PurchaseOrderPage';
import PurchaseOrderAddPage from '../PurchaseOrder/PurchaseOrderAddPage';
import PartPage from '../Part/PartPage';
import PartViewPage from '../Part/PartViewPage/PartViewPage';
import PartAddPage from '../Part/PartAddPage';
import SupplierPage from '../Supplier/SupplierPage';
import SupplierViewPage from '../Supplier/SupplierViewPage/SupplierViewPage';
import SupplierAddPage from '../Supplier/SupplierAddPage';
import SettingsPage from '../SettingsPage';
import CustomerPage from '../Customer/CustomerPage';
import CustomerViewPage from '../Customer/CustomerViewPage';
import CustomerAddPage from '../Customer/CustomerAddPage';
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
              <Route path={`${CONFIG.SALES_ORDER_URL}add`} component={SalesOrderAddPage} />
              <Route path={`${CONFIG.SALES_ORDER_URL}/:salesOrderID`} component={SalesOrderViewPage} />
              <Route path={CONFIG.SALES_ORDER_URL} component={SalesOrderPage} />
              <Route path={`${CONFIG.PURCHASE_ORDER_URL}add`} component={PurchaseOrderAddPage} />
              <Route path={CONFIG.PURCHASE_ORDER_URL} component={PurchaseOrderPage} />
              <Route path={`${CONFIG.PARTS_URL}add`} component={PartAddPage} />
              <Route path={`${CONFIG.PARTS_URL}/:partID`} component={PartViewPage} />
              <Route path={CONFIG.PARTS_URL} component={PartPage} />
              <Route path={`${CONFIG.SUPPLIER_URL}add`} component={SupplierAddPage} />
              <Route path={`${CONFIG.SUPPLIER_URL}/:supplierID`} component={SupplierViewPage} />
              <Route path={CONFIG.SUPPLIER_URL} component={SupplierPage} />
              <Route path={`${CONFIG.CUSTOMER_URL}add`} component={CustomerAddPage} />
              <Route path={`${CONFIG.CUSTOMER_URL}/:customerID`} component={CustomerViewPage} />
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