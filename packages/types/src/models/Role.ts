import { Schema } from 'mongoose';

export const ROLE_TYPES = {
  ORACLE_MANAGER: 'oracle_manager',
  REBALANCER: 'rebalancer',
  OWNER: 'owner',
} as const;

export const RoleSchema = new Schema({
  address: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export interface Role {
  address: string;
  name: string;
  role: (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES];
  createdAt: Date;
  updatedAt: Date;
}
