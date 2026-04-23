import * as Sentry from '@sentry/react';

// Initialize Sentry only if DSN provided
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] })
    ],
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_COMMIT_SHA,
  });
}

export { Sentry };
