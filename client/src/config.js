const CONFIG = {};

CONFIG.SERVER_URL = 'http://localhost:3000';

// Note that the following URLS are client-side URLS
// and are not the backend API URLs
// Menu URLs (used as keys)
CONFIG.HOME_URL = '/';
CONFIG.SALES_ORDERS_URL = '/sales';
CONFIG.PURCHASE_ORDERS_URL = '/purchases';
CONFIG.PARTS_URL = '/parts';
CONFIG.SUPPLIER_URL = '/suppliers';
CONFIG.CUSTOMER_URL = '/customers';
CONFIG.USER_URL = '/users';

// Non-Menu URLS
CONFIG.SETTINGS_URL = '/settings';
CONFIG.LOGIN_URL = '/login';
CONFIG.ERROR_400_URL = '/error400'; // Bad Request
CONFIG.ERROR_403_URL = '/error403'; // Forbidden
CONFIG.ERROR_404_URL = '/error404'; // Not Found
CONFIG.ERROR_500_URL = '/error500'; // Internal Server Error

// For Documentation Purposes
/*
-- Users
--- Specific User: CONFIG.USER_URL + '/:username'
--- Edit Users: CONFIG.USER_URL + '/:username/edit'
--- Add Users: CONFIG.USER_URL + 'add' (Note: the add has no / prefix, so it is concatenated to /users)

-- Suppliers
--- Specific Supplier (View + Edit): CONFIG.SUPPLIER_URL + '/:supplierObjID'
--- Add Supplier: CONFIG.SUPPLIER_URL + 'add' (Note: the add has no / prefix, so it is concatenated to /suppliers)


*/

// Sub-Menu Keys
CONFIG.DATA_SUB_MENU_KEY = 'dataSM';

// Tag Colours
CONFIG.ACTIVE_TAG_COLOR = 'green';
CONFIG.ARCHIVED_TAG_COLOR = 'gold';

export default CONFIG;
