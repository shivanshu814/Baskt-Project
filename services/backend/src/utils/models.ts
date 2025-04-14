import { OracleConfigSchema, AssetConfigSchema } from '@baskt/types';
import mongoose from 'mongoose';

export const AssetConfigModel = mongoose.model('AssetConfig', AssetConfigSchema);
export const OracleConfigModel = mongoose.model('OracleConfig', OracleConfigSchema);
