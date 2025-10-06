import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { ListingsController } from './listings.controller';
import { PropertiesService } from './properties.service';
import { ListingsService } from './listings.service';
import { Property } from './entities/property.entity';
import { Listing } from './entities/listing.entity';
import { PermitsModule } from '../permits/permits.module';

@Module({
  imports: [TypeOrmModule.forFeature([Property, Listing]), PermitsModule],
  controllers: [PropertiesController, ListingsController],
  providers: [PropertiesService, ListingsService],
  exports: [PropertiesService, ListingsService],
})
export class PropertiesModule {}
