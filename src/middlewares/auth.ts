import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../types/index.js';

// Middleware to ensure the user is authenticated
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] No token found in request headers.');
      return res.status(401).json({
        success: false,
        message: 'You need to provide a token to access this resource.',
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      console.warn('[Auth] Token verification failed or token expired.');
      return res.status(401).json({
        success: false,
        message: 'Your token is invalid or has expired. Please log in again.',
      });
    }

    // Attach user info for downstream routes
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };

    next(); // Everything looks good, continue
  } catch (err: any) {
    console.error('[Auth] Middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed due to an internal error.',
      error: err.message,
    });
  }
};