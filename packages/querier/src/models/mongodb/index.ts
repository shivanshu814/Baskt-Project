import {
  AssetMetadataSchema,
  BasktMetadataSchema,
  OrderSchema,
  PositionMetadataSchema,
  FeeEventMetadataSchema,
  AccessCodeSchema,
  AuthorizedWalletSchema,
} from '../../types/models';
import mongoose from 'mongoose';

export const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('BasktMetadata', BasktMetadataSchema);
export const OrderMetadataModel = mongoose.model('OrderMetadata', OrderSchema);
export const PositionMetadataModel = mongoose.model('PositionMetadata', PositionMetadataSchema);
export const FeeEventMetadataModel = mongoose.model('FeeEventMetadata', FeeEventMetadataSchema);
export const AccessCodeModel = mongoose.model('AccessCode', AccessCodeSchema);
export const AuthorizedWalletModel = mongoose.model('AuthorizedWallet', AuthorizedWalletSchema);
