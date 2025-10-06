import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConsentModule } from './modules/consent/consent.module';
import { PermitsModule } from './modules/permits/permits.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AIModule } from './modules/ai/ai.module';
import { ValuationsModule } from './modules/valuations/valuations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SearchModule } from './modules/search/search.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './health/health.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'real_estate_dev'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Never use in production
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ConsentModule,
    PermitsModule,
    PropertiesModule,
    LeadsModule,
    AIModule,
    ValuationsModule,
    AnalyticsModule,
    MessagingModule,
    DocumentsModule,
    SearchModule,
    PaymentsModule,
    ReportsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
