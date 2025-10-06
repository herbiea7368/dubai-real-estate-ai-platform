import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function configureSecurity(app: INestApplication) {
  // Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Swagger
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Swagger
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600,
  });

  // Disable X-Powered-By header
  app.getHttpAdapter().getInstance().disable('x-powered-by');
}
