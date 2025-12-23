import redis from '../config/redis.js';

class CacheService {
  private static instance: CacheService;
  private defaultTTL: number = 3600; // 1 hour in seconds

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Utility to generate cache keys
  private generateKey(prefix: string, identifier: string | number): string {
    return `${prefix}:${identifier}`;
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.client.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set data in cache with optional TTL
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redis.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete specific cache key
  async delete(key: string): Promise<boolean> {
    try {
      await redis.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys matching a pattern
  async deletePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redis.client.keys(pattern);
      if (keys.length) await redis.client.del(...keys);
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return false;
    }
  }

  // Cache key generators for different entities
  keys = {
    note: (id: number) => this.generateKey('note', id),
    userNotes: (userId: number, page: number, limit: number) =>
      this.generateKey('user_notes', `${userId}:${page}:${limit}`),
    noteVersions: (noteId: number) => this.generateKey('note_versions', noteId),
    searchResults: (userId: number, keyword: string) =>
      this.generateKey('search', `${userId}:${keyword}`),
  };

  // Invalidate all cache related to a user's notes
  async invalidateUserNotes(userId: number): Promise<boolean> {
    try {
      await Promise.all([
        this.deletePattern(`user_notes:${userId}:*`),
        this.deletePattern(`search:${userId}:*`),
      ]);
      return true;
    } catch (error) {
      console.error(`Invalidate user notes error for user ${userId}:`, error);
      return false;
    }
  }

  // Invalidate specific note cache
  async invalidateNote(noteId: number): Promise<boolean> {
    try {
      await Promise.all([
        this.delete(this.keys.note(noteId)),
        this.delete(this.keys.noteVersions(noteId)),
      ]);
      return true;
    } catch (error) {
      console.error(`Invalidate note error for note ${noteId}:`, error);
      return false;
    }
  }
}

export default CacheService.getInstance();
