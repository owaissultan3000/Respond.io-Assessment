import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

class Environment {
  private static instance: Environment;
  public config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        name: process.env.DB_NAME || 'notes_db',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '5', 10),
          min: parseInt(process.env.DB_POOL_MIN || '0', 10),
          acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
        },
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },
      jwt: {
        secret: process.env.JWT_SECRET || '',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || '',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      },
    };
  }

  private validateConfig(): void {
    const requiredVars = [
      'DB_NAME',
      'DB_USER',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const missing = requiredVars.filter(
      (varName) => !process.env[varName]
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    if (this.config.jwt.secret.length < 32) {
      console.warn(
        'Warning: JWT_SECRET should be at least 32 characters long for security'
      );
    }
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

export default Environment.getInstance();