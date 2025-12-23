import type { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cacheService.js';

// Cache middleware to handle cache hits and misses
export const cacheMiddleware = (keyGenerator: (req: Request) => string, ttl?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator(req);
    
    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.status(200).json({
          success: true,
          message: 'Data retrieved from cache',
          data: cachedData,
          cached: true,
        });
      }

      console.log(`Cache MISS: ${cacheKey}`);

      // Override res.json to add caching on success
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode === 200 && body.success) {
          cacheService.set(cacheKey, body.data, ttl).catch(err => {
            console.error('Failed to cache response:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Key generator for single note
export const noteCacheKey = (req: Request): string => {
  return cacheService.keys.note(parseInt(req.params.id));
};

// Key generator for user’s notes list
export const userNotesCacheKey = (req: Request): string => {
  const userId = (req as any).user?.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  return cacheService.keys.userNotes(userId, page, limit);
};

// Key generator for search results
export const searchCacheKey = (req: Request): string => {
  const userId = (req as any).user?.id;
  const keyword = req.query.keyword as string;
  return cacheService.keys.searchResults(userId, keyword);
};

// Key generator for note versions
export const noteVersionsCacheKey = (req: Request): string => {
  return cacheService.keys.noteVersions(parseInt(req.params.id));
};
