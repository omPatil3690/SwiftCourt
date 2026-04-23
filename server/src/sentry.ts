import * as SentryNode from '@sentry/node';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from './config/env.js';

// Initialize Sentry (no-op if DSN not set)
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  SentryNode.init({
    dsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0.1,
  });
}

export const sentryRequestHandler: RequestHandler = (req, _res, next) => {
  // establish minimal context in breadcrumb
  if (!process.env.SENTRY_DSN) return next();
  SentryNode.addBreadcrumb({
    category: 'http',
    message: `${req.method} ${req.originalUrl}`,
    level: 'info',
  });
  return next();
};

export const sentryErrorHandler: ErrorRequestHandler = (err, _req, _res, next) => {
  if (!process.env.SENTRY_DSN) return next(err);
  SentryNode.captureException(err);
  return next(err);
};

export { SentryNode as Sentry };
