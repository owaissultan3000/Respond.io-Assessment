import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

export interface TokenPayload {
  id: number;
  email: string;
  username: string;
}

// Type-cast secrets
const accessTokenSecret: Secret = env.config.jwt.secret;
const refreshTokenSecret: Secret = env.config.jwt.refreshSecret;

// Common sign options
const accessTokenOptions: SignOptions = { expiresIn: env.config.jwt.expiresIn as SignOptions['expiresIn'] };

// Generate access token
export const generateAccessToken = (user: TokenPayload): string => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    accessTokenSecret,
    accessTokenOptions
  );
};

// Generate refresh token
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, accessTokenSecret) as TokenPayload;
  } catch {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, refreshTokenSecret) as TokenPayload;
  } catch {
    return null;
  }
};

export const getRefreshTokenExpiry = (): Date => {
  const expiryDays = 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return expiryDate;
};
