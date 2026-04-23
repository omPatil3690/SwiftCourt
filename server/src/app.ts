import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { facilityRouter } from './modules/facility/facility.routes.js';
import { courtRouter } from './modules/court/court.routes.js';
import { bookingRouter } from './modules/booking/booking.routes.js';
import { bookingExtrasRouter } from './modules/booking/booking.extras.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import reviewRouter from './modules/review/review.routes.js';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes.js';
import { badgeRouter } from './modules/badge/badge.routes.js';
import { errorHandler, notFound } from './middleware/error.js';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './sentry';

export const app = express();

// Initialize Sentry early
initSentry();

// Sentry request context
app.use(sentryRequestHandler);

app.use(helmet());

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (env.nodeEnv === 'development') {
      // Allow all localhost ports in development
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(null, true); // Allow in development for debugging
      }
    } else {
      // Production CORS
      const allowedOrigins = Array.isArray(env.corsOrigin) ? env.corsOrigin : [env.corsOrigin];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/facilities', facilityRouter);
app.use('/courts', courtRouter);
app.use('/bookings', bookingRouter);
app.use('/bookings', bookingExtrasRouter);
app.use('/admin', adminRouter);
app.use('/reviews', reviewRouter);
app.use('/loyalty', loyaltyRouter);
app.use('/badges', badgeRouter);

app.use(notFound);
// Sentry error capture must come before our error handler
app.use(sentryErrorHandler);
app.use(errorHandler);
