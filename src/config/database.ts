import { Sequelize } from 'sequelize';
import env from './env.js';

class Database {
  private static instance: Database;
  public sequelize: Sequelize;
  private maxRetries = 5;
  private retryDelay = 3000;

  private constructor() {
    const { database } = env.config;

    this.sequelize = new Sequelize(
      database.name,
      database.user,
      database.password,
      {
        host: database.host,
        port: database.port,
        dialect: 'mysql',
        logging: env.isDevelopment() ? console.log : false,
        pool: {
          max: database.pool.max,
          min: database.pool.min,
          acquire: database.pool.acquire,
          idle: database.pool.idle,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
        dialectOptions: {
          connectTimeout: 60000,
          // Add these options for better connection stability
          dateStrings: true,
          typeCast: true,
        },
        retry: {
          max: 3,
        },
      }
    );
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async connect(): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Attempting to connect to database (attempt ${attempt}/${this.maxRetries})...`);
        await this.sequelize.authenticate();
        console.log('✓ Database connection established successfully');
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(`✗ Database connection attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
          await this.sleep(this.retryDelay);
        }
      }
    }

    console.error('✗ Unable to connect to the database after multiple attempts');
    throw lastError;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      console.log('✓ Database connection closed successfully');
    } catch (error) {
      console.error('✗ Error closing database connection:', error);
      throw error;
    }
  }

  public async sync(options?: { force?: boolean; alter?: boolean }): Promise<void> {
    try {
      await this.sequelize.sync(options);
      console.log('✓ Database synchronized successfully');
    } catch (error) {
      console.error('✗ Error synchronizing database:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default Database.getInstance();