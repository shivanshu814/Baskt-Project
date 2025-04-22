import { AssetMetadataSchema, RoleSchema } from '@baskt/types';
import mongoose from 'mongoose';

export const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);
export const RoleModel = mongoose.model('Role', RoleSchema);
