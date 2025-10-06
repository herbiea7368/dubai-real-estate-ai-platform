import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ValuationEngineService } from './services/valuation-engine.service';
import { MarketDataService } from './services/market-data.service';
import { EstimateValueDto } from './dto/estimate-value.dto';
import { RentalEstimateDto } from './dto/rental-estimate.dto';
import { UpdateMarketDataDto } from './dto/update-market-data.dto';
import { PropertyType } from '../properties/entities/property.entity';

@Controller('valuations')
export class ValuationsController {
  constructor(
    private readonly valuationEngine: ValuationEngineService,
    private readonly marketDataService: MarketDataService,
  ) {}

  @Post('estimate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.BUYER, UserRole.ADMIN)
  async estimateValue(@Body() dto: EstimateValueDto, @Request() req: any) {
    const userId = req.user.userId;

    // If propertyId provided, use it directly
    if (dto.propertyId) {
      const valuation = await this.valuationEngine.estimateValue(
        dto.propertyId,
        userId,
      );

      return {
        estimateAed: valuation.estimatedValueAed,
        confidenceLow: valuation.confidenceLowAed,
        confidenceHigh: valuation.confidenceHighAed,
        confidenceLevel: valuation.confidenceLevel,
        pricePerSqft: valuation.pricePerSqft,
        comparables: valuation.comparableProperties,
        features: valuation.features,
        marketFactors: valuation.marketFactors,
        mae: valuation.mae,
        valuationId: valuation.id,
      };
    }

    // Otherwise, use manual features
    const propertyData = {
      community: dto.community,
      type: dto.propertyType,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      areaSqft: dto.areaSqft,
      amenities: dto.amenities || [],
      completionStatus: dto.completionStatus,
      completionYear: dto.completionYear,
      floor: dto.floor,
      view: dto.view,
    };

    const valuation = await this.valuationEngine.estimateValue(
      propertyData,
      userId,
    );

    return {
      estimateAed: valuation.estimatedValueAed,
      confidenceLow: valuation.confidenceLowAed,
      confidenceHigh: valuation.confidenceHighAed,
      confidenceLevel: valuation.confidenceLevel,
      pricePerSqft: valuation.pricePerSqft,
      comparables: valuation.comparableProperties,
      features: valuation.features,
      marketFactors: valuation.marketFactors,
      mae: valuation.mae,
      valuationId: valuation.id,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getValuation(@Param('id') id: string) {
    const valuation = await this.valuationEngine.getValuationById(id);

    if (!valuation) {
      return {
        statusCode: 404,
        message: 'Valuation not found',
      };
    }

    return valuation;
  }

  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard)
  async getPropertyValuation(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    // Try to get latest valuation
    let valuation = await this.valuationEngine.getLatestValuation(propertyId);

    // If none exists, create new one
    if (!valuation) {
      valuation = await this.valuationEngine.estimateValue(propertyId, userId);
    }

    return valuation;
  }

  @Post('rental-estimate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.BUYER, UserRole.ADMIN)
  async estimateRental(@Body() dto: RentalEstimateDto, @Request() req: any) {
    const userId = req.user.userId;

    // Get or create valuation
    let valuation = await this.valuationEngine.getLatestValuation(dto.propertyId);

    if (!valuation) {
      valuation = await this.valuationEngine.estimateValue(dto.propertyId, userId);
    }

    const annualRent = valuation.estimatedRentAed || 0;
    const monthlyRent = annualRent / 12;
    const grossYield = valuation.grossYieldPct || 0;

    return {
      propertyId: dto.propertyId,
      annualRentAed: annualRent,
      monthlyRentAed: monthlyRent,
      grossYieldPct: grossYield,
      basedOnPrice: dto.purchasePrice || valuation.estimatedValueAed,
    };
  }

  @Get('comparables/:propertyId')
  @UseGuards(JwtAuthGuard)
  async getComparables(@Param('propertyId') propertyId: string) {
    // This would need the property repository injected
    // For now, get from latest valuation
    const valuation = await this.valuationEngine.getLatestValuation(propertyId);

    if (!valuation) {
      return {
        statusCode: 404,
        message: 'No valuation found. Please estimate value first.',
      };
    }

    return {
      propertyId,
      comparables: valuation.comparableProperties,
    };
  }

  @Get('market-data/:community')
  async getMarketData(
    @Param('community') community: string,
    @Query('propertyType') propertyType?: PropertyType,
    @Query('months') months?: number,
  ) {
    if (!propertyType) {
      return {
        statusCode: 400,
        message: 'propertyType query parameter is required',
      };
    }

    const monthsBack = months || 12;

    const currentData = await this.marketDataService.getMarketData(
      community,
      propertyType,
    );

    const trends = await this.marketDataService.getMarketTrends(
      community,
      propertyType,
      monthsBack,
    );

    const yoyChange = await this.marketDataService.calculateYoYChange(
      community,
      propertyType,
    );

    return {
      community,
      propertyType,
      current: currentData,
      trends,
      yoyChange,
    };
  }

  @Post('market-data/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE, UserRole.ADMIN)
  async updateMarketData(@Body() dto: UpdateMarketDataDto) {
    const marketData = await this.marketDataService.updateMarketData(dto);

    return {
      statusCode: 201,
      message: 'Market data updated successfully',
      data: marketData,
    };
  }
}
