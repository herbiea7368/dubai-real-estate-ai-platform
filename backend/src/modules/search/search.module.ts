import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchIndexService } from './services/index.service';
import { SearchQueryService } from './services/search-query.service';
import { GeoSearchService } from './services/geo-search.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { PropertySearchListener } from './listeners/property.listener';
import { ListingSearchListener } from './listeners/listing.listener';
import { Property } from '../properties/entities/property.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property, AnalyticsEvent])],
  controllers: [SearchController],
  providers: [
    SearchIndexService,
    SearchQueryService,
    GeoSearchService,
    SearchAnalyticsService,
    PropertySearchListener,
    ListingSearchListener,
  ],
  exports: [
    SearchIndexService,
    SearchQueryService,
    GeoSearchService,
    SearchAnalyticsService,
  ],
})
export class SearchModule {}
