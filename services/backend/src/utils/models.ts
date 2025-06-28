import {
  AssetMetadataSchema,
  BasktMetadataSchema,
  OrderSchema,
  PositionMetadataSchema,
  AccessCodeSchema,
  AuthorizedWalletSchema,
} from '@baskt/types';
import mongoose from 'mongoose';

export const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('BasktMetadata', BasktMetadataSchema);
export const OrderMetadataModel = mongoose.model('OrderMetadata', OrderSchema);
export const PositionMetadataModel = mongoose.model('PositionMetadata', PositionMetadataSchema);
export const AccessCode = mongoose.model('AccessCode', AccessCodeSchema);
export const AuthorizedWallet = mongoose.model('AuthorizedWallet', AuthorizedWalletSchema);
