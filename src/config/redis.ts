import { Redis } from 'ioredis';
import env from './env.js';

class RedisClient {
  private static instance: RedisClient;
  public client: Redis;
  private isConnected: boolean = false;

  private constructor() {
    const { redis } = env.config;

    this.client = new Redis({
      host: redis.host,
      port: redis.port,
      password: redis.password,
      db: redis.db,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('✓ Redis connection established');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('✓ Redis client ready');
    });

    this.client.on('error', (error) => {
      console.error('✗ Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('✓ Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('⟳ Redis reconnecting...');
    });
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('✓ Redis disconnected successfully');
    } catch (error) {
      console.error('✗ Error disconnecting Redis:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async ping(): Promise<string> {
    return await this.client.ping();
  }
}

export default RedisClient.getInstance();
