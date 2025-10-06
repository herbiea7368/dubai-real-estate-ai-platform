import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  validateSync,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsOptional()
  @IsUrl({ require_tld: false })
  API_URL?: string;

  // Database
  @IsString()
  DATABASE_HOST!: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DATABASE_PORT: number = 5432;

  @IsString()
  DATABASE_USER!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  DATABASE_NAME!: string;

  @IsOptional()
  @IsBoolean()
  DATABASE_SSL?: boolean = true;

  @IsOptional()
  @IsBoolean()
  DATABASE_SYNCHRONIZE?: boolean = false;

  @IsOptional()
  @IsBoolean()
  DATABASE_LOGGING?: boolean = false;

  // JWT
  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRATION?: string = '7d';

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRATION?: string = '30d';

  // AWS
  @IsOptional()
  @IsString()
  AWS_REGION?: string = 'me-central-1';

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_S3_BUCKET?: string;

  // OpenSearch
  @IsOptional()
  @IsString()
  OPENSEARCH_NODE?: string;

  @IsOptional()
  @IsString()
  OPENSEARCH_USERNAME?: string;

  @IsOptional()
  @IsString()
  OPENSEARCH_PASSWORD?: string;

  // AI Services
  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_MODEL?: string = 'claude-sonnet-4-20250514';

  // WhatsApp
  @IsOptional()
  @IsString()
  WHATSAPP_API_URL?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_PHONE_NUMBER_ID?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_ACCESS_TOKEN?: string;

  // SMS
  @IsOptional()
  @IsString()
  SMS_ACCOUNT_SID?: string;

  @IsOptional()
  @IsString()
  SMS_AUTH_TOKEN?: string;

  // Payment Gateways
  @IsOptional()
  @IsString()
  TELR_STORE_ID?: string;

  @IsOptional()
  @IsString()
  TELR_AUTH_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  // Security
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(20)
  BCRYPT_ROUNDS?: number = 12;

  // Rate Limiting
  @IsOptional()
  @IsNumber()
  @Min(1)
  THROTTLE_TTL?: number = 60;

  @IsOptional()
  @IsNumber()
  @Min(1)
  THROTTLE_LIMIT?: number = 100;

  // Logging
  @IsOptional()
  @IsEnum(['error', 'warn', 'info', 'debug', 'verbose'])
  LOG_LEVEL?: string = 'info';

  @IsOptional()
  @IsBoolean()
  ENABLE_SWAGGER?: boolean = true;

  @IsOptional()
  @IsBoolean()
  ENABLE_AI_FEATURES?: boolean = true;

  @IsOptional()
  @IsBoolean()
  ENABLE_MESSAGING?: boolean = true;

  @IsOptional()
  @IsBoolean()
  ENABLE_PAYMENTS?: boolean = true;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
    });

    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}`,
    );
  }

  return validatedConfig;
}

export function logMissingOptionalVariables(config: EnvironmentVariables) {
  const optionalVars = [
    { key: 'AWS_ACCESS_KEY_ID', message: 'S3 file uploads will not work' },
    { key: 'OPENSEARCH_NODE', message: 'Search functionality will be disabled' },
    { key: 'ANTHROPIC_API_KEY', message: 'AI features will be disabled' },
    { key: 'WHATSAPP_ACCESS_TOKEN', message: 'WhatsApp messaging will be disabled' },
    { key: 'SMS_ACCOUNT_SID', message: 'SMS functionality will be disabled' },
    { key: 'TELR_STORE_ID', message: 'Telr payment gateway will be disabled' },
    { key: 'STRIPE_SECRET_KEY', message: 'Stripe payment gateway will be disabled' },
  ];

  const warnings: string[] = [];

  for (const { key, message } of optionalVars) {
    if (!config[key as keyof EnvironmentVariables]) {
      warnings.push(`⚠️  ${key} is not set - ${message}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional Environment Variables Missing:\n');
    warnings.forEach((warning) => console.warn(warning));
    console.warn('\n');
  }
}
