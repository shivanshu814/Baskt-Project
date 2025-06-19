/**
 * Tab configuration for the admin dashboard
 */
import { ComponentType } from 'react';
import { AdminAssetsList } from '../components/dashboard/AssetsList';
import { AdminBasktsList } from '../components/dashboard/BasktsList';
import { ListNewAssetButton } from '../components/assets/ListNewAssetButton';
import { ProtocolDetails } from '../components/dashboard/Protocol';
import { RolesManagement } from '../components/dashboard/RolesList';
import { LiquidityPoolManagement } from '../components/dashboard/BasktLiquidity';
import OrderList from '../components/orders/OrderList';
import { TabConfig, TabProps } from '../types';

import { TAB_IDS } from '../constants/tabs';
import PositionList from '../components/position/PositionList';
import HistoryList from '../components/history/HistoryList';

export const TAB_CONFIG: TabConfig[] = [
  {
    id: TAB_IDS.ASSETS,
    label: 'Assets',
    component: AdminAssetsList,
    actionButton: ListNewAssetButton,
  },
  {
    id: TAB_IDS.BASKTS,
    label: 'Baskts',
    component: AdminBasktsList,
  },
  {
    id: TAB_IDS.ORDERS,
    label: 'Orders',
    component: OrderList,
  },
  {
    id: TAB_IDS.POSITIONS,
    label: 'Positions',
    component: PositionList,
  },
  {
    id: TAB_IDS.PROTOCOL,
    label: 'Protocol',
    component: ProtocolDetails,
  },
  {
    id: TAB_IDS.ROLES,
    label: 'Roles',
    component: RolesManagement as ComponentType<TabProps>,
  },
  {
    id: TAB_IDS.LIQUIDITY,
    label: 'BLP',
    component: LiquidityPoolManagement,
  },
  {
    id: TAB_IDS.HISTORY,
    label: 'History',
    component: HistoryList,
  },
];
