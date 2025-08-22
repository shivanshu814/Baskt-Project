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
  const convertBNToStrings = (obj: any, depth: number = 0): any => {

    try {
      if(depth > 10) {
        return obj;
      }
      
      if (obj === null || obj === undefined || Object.keys(obj).length === 0) {
        return obj;
      }

      if (obj._bsontype === 'ObjectID' || 
        (obj.constructor && obj.constructor.name === 'ObjectId')) {
        return '';
      }
      
      if (obj instanceof BN) {
        return obj.toString();
      }
      
      if (Array.isArray(obj)) {
        return obj.map((item) => convertBNToStrings(item, depth + 1));
      }
      
      if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBNToStrings(value, depth + 1);
        }
        return converted;
      }

      return obj;
    } catch (error) {
      console.error("Error converting BN to string", error);
      return obj;
    }
  };
  
  // Apply the conversion to the result
  if (result.ok) {
    result.data = convertBNToStrings(result.data, 0);
  }
  
  return result;
});


export const router = t.router;
export const publicProcedure = t.procedure.use(bnToStringMiddleware);
