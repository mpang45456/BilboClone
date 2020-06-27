const CONFIG = {};

CONFIG.SERVER_URL = 'http://localhost:3000';

// Note that the following URLS are client-side URLS
// and are not the backend API URLs
// Menu URLs (used as keys)
CONFIG.HOME_URL = '/';
CONFIG.SALES_ORDERS_URL = '/sales';
CONFIG.PURCHASE_ORDERS_URL = '/purchases';
CONFIG.INVENTORY_URL = '/inventory';
CONFIG.SUPPLIER_URL = '/suppliers';
CONFIG.CUSTOMER_URL = '/customers';
CONFIG.USER_URL = '/users';

// Non-Menu URLS
CONFIG.SETTINGS_URL = '/settings';
CONFIG.ERROR_403_URL = '/error403';
CONFIG.ERROR_500_URL = '/error500';

// For Documentation Purposes
/*
-- Users
--- Specific User: CONFIG.USER_URL + '/:username'
--- Edit Users: CONFIG.USER_URL + '/:username/edit'
--- Add Users: CONFIG.USER_URL + 'add' (Note: the add has no / prefix, so it is concatenated to /users)


*/

// Sub-Menu Keys
CONFIG.DATA_SUB_MENU_KEY = 'dataSM';

export default CONFIG;
