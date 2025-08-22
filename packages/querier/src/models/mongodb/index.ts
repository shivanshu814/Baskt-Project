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
import mongooseLeanGetters from 'mongoose-lean-getters';

BasktMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
AssetMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
OrderMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
PositionMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
ProtocolMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
FeeEventMetadataSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
LiquidityPoolSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
LiquidityDepositSchema.plugin(mongooseLeanGetters);
WithdrawalRequestSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
RebalanceRequestSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
BasktRebalanceHistorySchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
AccessCodeSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });
AuthorizedWalletSchema.plugin(mongooseLeanGetters,  { defaultLeanOptions: { getters: true } });



export const AssetMetadataModel = mongoose.model('asset_metadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('baskt_metadata', BasktMetadataSchema);
export const OrderMetadataModel = mongoose.model('order_metadata', OrderMetadataSchema);
export const PositionMetadataModel = mongoose.model('position_metadata', PositionMetadataSchema);
export const ProtocolMetadataModel = mongoose.model('protocol_metadata', ProtocolMetadataSchema);
export const FeeEventMetadataModel = mongoose.model('fee_event_metadata', FeeEventMetadataSchema);
export const LiquidityPoolModel = mongoose.model('liquidity_pool', LiquidityPoolSchema);
export const LiquidityDepositModel = mongoose.model('liquidity_deposits', LiquidityDepositSchema);
export const WithdrawalRequestModel = mongoose.model('withdrawal_requests', WithdrawalRequestSchema);
export const RebalanceRequestModel = mongoose.model('rebalance_request', RebalanceRequestSchema);
export const BasktRebalanceHistoryModel = mongoose.model('baskt_rebalance_history', BasktRebalanceHistorySchema);
export const AccessCodeModel = mongoose.model('AccessCode', AccessCodeSchema);
export const AuthorizedWalletModel = mongoose.model('AuthorizedWallet', AuthorizedWalletSchema);
