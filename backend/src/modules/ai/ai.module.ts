import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { StagingController } from './staging.controller';
import { NLPService } from './services/nlp.service';
import { ImageStagingService } from './services/image-staging.service';
import { ImageStorageService } from './services/image-storage.service';
import { AnthropicClient } from './clients/anthropic.client';
import { ContentValidator } from './utils/content-validator';
import { Property } from '../properties/entities/property.entity';
import { Permit } from '../permits/entities/permit.entity';
import { StagedImage } from './entities/staged-image.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Property, Permit, StagedImage]),
  ],
  controllers: [AIController, StagingController],
  providers: [
    NLPService,
    ImageStagingService,
    ImageStorageService,
    AnthropicClient,
    ContentValidator,
  ],
  exports: [NLPService, ImageStagingService, AnthropicClient],
})
export class AIModule {}
