import {
  OrderMetadataSchema,
  PositionMetadataSchema,
  FeeEventMetadataSchema,
  AccessCodeSchema,
  AuthorizedWalletSchema,
  AssetMetadataSchema,
  BasktMetadataSchema,
  LiquidityPoolSchema,
  LiquidityDepositSchema,
  WithdrawalRequestSchema,
  RebalanceRequestSchema,
  BasktRebalanceHistorySchema,
} from '../../types/models';
import mongoose from 'mongoose';
import ProtocolMetadataSchema from '../../types/models/schemas/ProtocolMetadataSchema';

export const AssetMetadataModel = mongoose.model('asset_metadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('baskt_metadata', BasktMetadataSchema);
export const OrderMetadataModel = mongoose.model('order_metadata', OrderMetadataSchema);
export const PositionMetadataModel = mongoose.model('position_metadata', PositionMetadataSchema);
export const ProtocolMetadataModel = mongoose.model('protocol_metadata', ProtocolMetadataSchema);
export const FeeEventMetadataModel = mongoose.model('fee_event_metadata', FeeEventMetadataSchema);
export const AccessCodeModel = mongoose.model('AccessCode', AccessCodeSchema);
export const AuthorizedWalletModel = mongoose.model('AuthorizedWallet', AuthorizedWalletSchema);
export const LiquidityPoolModel = mongoose.model('liquidity_pool', LiquidityPoolSchema);
export const LiquidityDepositModel = mongoose.model('liquidity_deposits', LiquidityDepositSchema);
export const WithdrawalRequestModel = mongoose.model('withdrawal_requests', WithdrawalRequestSchema);
export const RebalanceRequestModel = mongoose.model('rebalance_request', RebalanceRequestSchema);
export const BasktRebalanceHistoryModel = mongoose.model('baskt_rebalance_history', BasktRebalanceHistorySchema);