import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Tabs, Menu } from 'antd';
const { TabPane } = Tabs;
import { PlusOutlined } from "@ant-design/icons";
import { useAuth, PERMS } from '../../../context/AuthContext';
import CONFIG from '../../../config';
import { ShowMoreButton } from '../../UtilComponents';
import PartsTabContent from './PartsTabContent';
import PurchaseOrdersTabContent from './PurchaseOrdersTabContent';
import PropTypes from 'prop-types';

/**
 * Component rendering the tabs section
 * of <SupplierViewPage />.
 * 
 * Note: Whenever the active tab changes, the 
 * `showMoreButton` associated with the tab 
 * changes it dropdown menu option. See class
 * `TabsShowMoreButton`.
 */
export default function SupplierViewPageTabs(props) {
    const [activeTab, setActiveTab] = useState('1');

    return (
        <Tabs defaultActiveKey={activeTab}
              onChange={(activeKey) => setActiveTab(activeKey)}
              tabBarExtraContent={<TabsShowMoreButton 
                                    activeTab={activeTab}/>}>
            <TabPane tab='All Parts' key='1'>
                <PartsTabContent supplierid={props.supplierID}/>
            </TabPane>
            <TabPane tab='Purchase Orders' key='2'>
                <PurchaseOrdersTabContent supplierid={props.supplierID}/>
            </TabPane>
        </Tabs>
    )
}
SupplierViewPageTabs.propTypes = {
    supplierID: PropTypes.string.isRequired,
}

/**
 * `showMoreButton` that changes its 
 * dropdown menu option according to the
 * value of `props.activeTab`. 
 * 
 * If `props.activeTab` === '1' ('All Parts' tab):
 * display 'Add a Part'
 * 
 * If `props.activeTab` === '2' ('Purchase Orders' tab):
 * display 'Add a Purchase Order'
 */
function TabsShowMoreButton(props) {
    const history = useHistory();
    const { permissionsList } = useAuth();

    const buttonClicked = ({item, key, keyPath, domEvent}) => {
        if (key === 'addPart') {
            history.push(`${CONFIG.PARTS_URL}add`);
        } else if (key === 'addPurchaseOrder') {
            // TODO: Add implementation for Purchase Orders
            console.log('TO BE IMPLEMENTED');
        }
    }

    const menu = (
        <Menu onClick={buttonClicked}>
            {
                props.activeTab === '1'
                ? <Menu.Item 
                    key='addPart'
                    icon={<PlusOutlined/>}>
                    Add a Part
                  </Menu.Item>
                : <Menu.Item 
                    key='addPurchaseOrder'
                    icon={<PlusOutlined/>}>
                    Add a Purchase Order
                  </Menu.Item>
            }
        </Menu>
    )
    
    // TODO: Update disabled value for Purchase Orders permissions
    return (
        <ShowMoreButton 
            dropdownKey='tabShowMoreDropdown'
            menu={menu}
            disabled={props.activeTab === '1' && !permissionsList.includes(PERMS.PART_WRITE)}
        />
    )
}
TabsShowMoreButton.propTypes = {
    activeTab: PropTypes.string.isRequired,
}