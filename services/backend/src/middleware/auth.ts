import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import logger from '../utils/logger';

dotenv.config();

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_JWKS_URI = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`;
const PRIVY_AUDIENCE = PRIVY_APP_ID;
const PRIVY_ALGORITHM = 'ES256';

const jwksClient = jwksRsa({
  jwksUri: PRIVY_JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
});

const getSigningKey = (kid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        reject(new Error('Unable to get signing key'));
        return;
      }
      resolve(signingKey);
    });
  });
};

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyPrivyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
      req.user = undefined;
      return next();
    }

    const kid = decodedHeader.header.kid;
    const signingKey = await getSigningKey(kid);
    const decoded = jwt.verify(token, signingKey, {
      algorithms: [PRIVY_ALGORITHM],
      audience: PRIVY_AUDIENCE,
    });

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('JWT verification failed:', error);

    req.user = undefined;
    next();
  }
};