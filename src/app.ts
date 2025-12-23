import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import notesRoutes from './routes/notesRoutes.js';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: env.isDevelopment() ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.config.rateLimit.windowMs,
  max: env.config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.config.nodeEnv,
  });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
    ...(env.isDevelopment() && { stack: err.stack }),
  });
});

export default app;