/** @format */

import { initTRPC, TRPCError } from '@trpc/server';
import BN from 'bn.js';
import dotenv from 'dotenv';
dotenv.config();



const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof TRPCError ? error.cause : null,
      },
    };
  },
});
const bnToStringMiddleware = t.middleware(async ({ next }) => {
  const result = await next();
  
  // Convert BN objects to strings in the response
  const convertBNToStrings = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj._bsontype === 'ObjectID' || 
      (obj.constructor && obj.constructor.name === 'ObjectId') ||
      (typeof obj.toHexString === 'function' && typeof obj.toString === 'function')) {
      return '';
    }
    
    if (obj instanceof BN) {
      return obj.toString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertBNToStrings);
    }
    
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertBNToStrings(value);
      }
      return converted;
    }
    
    return obj;
  };
  
  // Apply the conversion to the result
  if (result.ok) {
    result.data = convertBNToStrings(result.data);
  }
  
  return result;
});
export const router = t.router;
export const publicProcedure = t.procedure.use(bnToStringMiddleware);
