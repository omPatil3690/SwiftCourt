import dotenv from 'dotenv';
import crypto from 'crypto';
// Load .env.local first if present, then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

// Required variables for runtime (minimal for local dev)
const REQUIRED = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  // Provide friendlier guidance instead of stack trace
  console.error('\n[ENV ERROR] Missing required environment variables:');
  missing.forEach(k => console.error(`  - ${k}`));
  console.error('\nCreate a server/.env file. You can start from server/.env.example');
  console.error('Example (DO NOT use in production):');
  console.error(`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quickcourt?schema=public`);
  console.error(`ACCESS_TOKEN_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.error(`REFRESH_TOKEN_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.error('\nAfter adding them, re-run: npm run dev');
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  dbUrl: process.env.DATABASE_URL!,
  // Allow multiple dev origins (vite default 5173, 8080/8081 variants, 3000) so front-end ports can vary
  corsOrigin: process.env.NODE_ENV === 'development'
    ? [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ]
    : (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']),
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '10', 10),
  // Payments removed: using simple receipt only. Keep keys undefined.
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM || 'QuickCourt <no-reply@quickcourt.local>'
  ,
  sentryDsn: process.env.SENTRY_DSN,
  adminInviteSecret: process.env.ADMIN_INVITE_SECRET
};
