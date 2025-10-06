import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  swaggerConfig,
  swaggerDocumentOptions,
  swaggerUiOptions,
} from './config/swagger.config';
import { configureSecurity } from './config/security.config';
import { createLogger } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(),
  });

  // Configure security (Helmet, CORS, etc.)
  configureSecurity(app);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Enable global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Setup Swagger/OpenAPI documentation
  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    swaggerDocumentOptions,
  );
  SwaggerModule.setup('api/docs', app, document, swaggerUiOptions);

  // Make JSON spec available at /api/docs-json
  // (Already available through Swagger setup)

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get('Logger');
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}

void bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
