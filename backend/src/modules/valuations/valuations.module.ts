import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Valuation } from './entities/valuation.entity';
import { MarketData } from './entities/market-data.entity';
import { Property } from '../properties/entities/property.entity';
import { ValuationsController } from './valuations.controller';
import { ValuationEngineService } from './services/valuation-engine.service';
import { FeatureEngineeringService } from './services/feature-engineering.service';
import { ComparablesService } from './services/comparables.service';
import { MarketDataService } from './services/market-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Valuation, MarketData, Property]),
  ],
  controllers: [ValuationsController],
  providers: [
    ValuationEngineService,
    FeatureEngineeringService,
    ComparablesService,
    MarketDataService,
  ],
  exports: [
    ValuationEngineService,
    FeatureEngineeringService,
    ComparablesService,
    MarketDataService,
  ],
})
export class ValuationsModule {}
