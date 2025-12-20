import app from './app.js';
import env from './config/env.js';
import database from './config/database.js';
import redis from './config/redis.js';

class Server {
  private isShuttingDown = false;

  async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Check Redis connection
      try {
        await redis.ping();
      } catch (error) {
        console.warn('⚠ Redis connection failed, continuing without cache');
      }

      // Sync database (in production, use migrations instead)
      if (env.isDevelopment()) {
        await database.sync({ alter: true });
      }

      // Start Express server
      const server = app.listen(env.config.port, () => {
        console.log(`
╔════════════════════════════════════════╗
║   Server is running                    ║
║   Port: ${env.config.port.toString().padEnd(31)}║
║   Environment: ${env.config.nodeEnv.padEnd(23)}║
║   Database: Connected                  ║
║   Redis: ${(redis.getConnectionStatus() ? 'Connected' : 'Disconnected').padEnd(28)}║
╚════════════════════════════════════════╝
        `);
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown(server);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(server: any): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      console.log(`\n${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('HTTP server closed');

        try {
          // Close database connection
          await database.disconnect();

          // Close Redis connection
          await redis.disconnect();

          console.log('All connections closed successfully');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
  }
}

// Start the server
const server = new Server();
server.start();