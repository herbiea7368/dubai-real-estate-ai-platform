import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

/**
 * Swagger/OpenAPI Configuration
 * Comprehensive API documentation for Dubai Real Estate AI Platform
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Dubai Real Estate AI Platform API')
  .setDescription(
    'Comprehensive API for Dubai/UAE real estate platform with AI capabilities. ' +
    'Features include property management, AI-powered content generation, ' +
    'virtual staging, automated valuations, PDPL-compliant consent management, ' +
    'Trakheesi permit validation, TDRA-compliant messaging, payment processing, ' +
    'advanced search with OpenSearch, and business intelligence reporting.',
  )
  .setVersion('1.0.0')
  .setContact(
    'Dubai Real Estate AI Platform',
    'https://yourdomain.com',
    'support@yourdomain.com',
  )
  .setLicense('Proprietary', 'https://yourdomain.com/license')
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://api-staging.yourdomain.com', 'Staging')
  .addServer('https://api.yourdomain.com', 'Production')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('Authentication', 'User registration, login, profile management')
  .addTag('Properties', 'Property management and CRUD operations')
  .addTag('Listings', 'Property listings with bilingual content and media')
  .addTag('Leads', 'Lead management, scoring, and assignment')
  .addTag('Permits', 'Trakheesi permit validation and compliance')
  .addTag('Consent & PDPL', 'PDPL-compliant consent and DSR management')
  .addTag('AI Services', 'AI-powered content generation and virtual staging')
  .addTag('Valuations', 'Automated valuation models and market analysis')
  .addTag('Messaging', 'TDRA-compliant WhatsApp and SMS messaging')
  .addTag('Payments', 'Payment processing and escrow management')
  .addTag('Reports', 'Business intelligence and custom reporting')
  .addTag('Search', 'Advanced search with OpenSearch and geo-queries')
  .addTag('Analytics', 'Platform analytics and insights')
  .addTag('Documents', 'Document processing and AI extraction')
  .build();

/**
 * Swagger document options for better organization
 */
export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) =>
    `${controllerKey}_${methodKey}`,
  deepScanRoutes: true,
};

/**
 * Swagger UI custom options
 */
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
    tryItOutEnabled: true,
    persistAuthorization: true,
  },
  customSiteTitle: 'Dubai Real Estate AI Platform API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1a73e8; }
  `,
};
