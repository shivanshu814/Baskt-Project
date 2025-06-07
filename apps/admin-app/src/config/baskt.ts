/**
 * Configuration for baskt-related components
 */
import { BASKT_TABLE_HEADER_IDS } from '../constants/baskt';

export const BASKT_TABLE_HEADERS = [
  { id: BASKT_TABLE_HEADER_IDS.NAME, label: 'Baskt Name' },
  { id: BASKT_TABLE_HEADER_IDS.ADDRESS, label: 'Baskt Address' },
  { id: BASKT_TABLE_HEADER_IDS.CREATOR, label: 'Creator' },
  { id: BASKT_TABLE_HEADER_IDS.IS_PUBLIC, label: 'Public' },
  { id: BASKT_TABLE_HEADER_IDS.CREATION_TIME, label: 'Created' },
  { id: BASKT_TABLE_HEADER_IDS.ACTIVE, label: 'Active' },
  { id: BASKT_TABLE_HEADER_IDS.LAST_REBALANCE_INDEX, label: 'Rebalance Index' },
  { id: BASKT_TABLE_HEADER_IDS.LAST_REBALANCE_TIME, label: 'Last Rebalanced' },
  { id: BASKT_TABLE_HEADER_IDS.BASELINE_NAV, label: 'Baseline NAV' },
  { id: BASKT_TABLE_HEADER_IDS.TOTAL_ASSETS, label: 'Assets' },
  { id: BASKT_TABLE_HEADER_IDS.PRICE, label: 'Current Price' },
  { id: BASKT_TABLE_HEADER_IDS.CHANGE_24H, label: '24h Change' },
  { id: BASKT_TABLE_HEADER_IDS.ACTIONS, label: '' },
] as const;
