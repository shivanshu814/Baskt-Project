import { AssetMetadataSchema, BasktMetadataSchema } from '@baskt/types';
import mongoose from 'mongoose';

export const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);
export const BasktMetadataModel = mongoose.model('BasktMetadata', BasktMetadataSchema);
