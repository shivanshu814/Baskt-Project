/**
 * Configuration for baskt-related components
 */
import { BASKT_TABLE_HEADER_IDS } from '../constants/baskt';

export const BASKT_TABLE_HEADERS = [
  { id: BASKT_TABLE_HEADER_IDS.NAME, label: 'Baskt Name' },
  { id: BASKT_TABLE_HEADER_IDS.ADDRESS, label: 'Baskt Address' },
  { id: BASKT_TABLE_HEADER_IDS.ACTIVE, label: 'Active' },
  { id: BASKT_TABLE_HEADER_IDS.ACTIONS, label: '' },
] as const;
