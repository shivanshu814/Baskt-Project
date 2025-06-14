import {
  AssetMetadataSchema,
  BasktMetadataSchema,
  OrderSchema,
  PositionSchema,
} from '@baskt/types';
import mongoose from 'mongoose';

export const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('BasktMetadata', BasktMetadataSchema);
export const OrderModel = mongoose.model('Order', OrderSchema);
export const PositionModel = mongoose.model('Position', PositionSchema);
