import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { logger } from '@/core/logger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Optimized for platform control
  });

  // 🛡️ Phase 0: Environment Integrity Check
  const REQUIRED_ENV = ['JWT_SECRET', 'APP_URL'];
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`❌ CRITICAL FAILURE: Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    } else {
      logger.warn(`⚠️ Warning: Missing environment variables for production logic: ${missing.join(', ')}`);
    }
  }

  // 🛡️ Phase 2: High-Integrity Error Handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 🛡️ Phase 1: Infrastructure Handshake
  try {
    const { query } = require('@/core/db/postgres');
    await query('SYSTEM', 'SELECT 1');
    logger.info('🐘 PostgreSQL Handshake: [SUCCESS]');
  } catch (err) {
    logger.warn('⚠️ WARNING: PostgreSQL Handshake Failed. Database-dependent domains will be degraded.');
    logger.warn(`   Error details: ${(err as any).message}`);
    // We proceed to allow the Control Plane to respond with diagnostic errors instead of crashing
  }

  // Global prefixes and versioning
  app.setGlobalPrefix('api');
  
  // Security & Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: '*', // We'll restrict this to HQ_SUBDOMAIN in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.SUPERADMIN_PORT || 4000;
  await app.listen(port);
  
  logger.info(`🚀 NEXUS COMMAND Control Plane active on port ${port}`);
}

bootstrap();
