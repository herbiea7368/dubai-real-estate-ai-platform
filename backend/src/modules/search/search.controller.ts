import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { SearchQueryService } from './services/search-query.service';
import { GeoSearchService } from './services/geo-search.service';
import { SearchIndexService } from './services/index.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { GeoSearchDto, GeoBoundsDto, ClusterPropertiesDto } from './dto/geo-search.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { OPENSEARCH_PROPERTIES_INDEX } from './config/opensearch.config';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchQueryService: SearchQueryService,
    private readonly geoSearchService: GeoSearchService,
    private readonly indexService: SearchIndexService,
    private readonly analyticsService: SearchAnalyticsService,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  @Get('properties')
  async searchProperties(
    @Query() searchDto: SearchPropertiesDto,
    @Request() req?: any,
  ) {
    const results = await this.searchQueryService.searchWithFacets(searchDto);

    // Track search
    const userId = req?.user?.id;
    const sessionId = req?.sessionID || req?.headers?.['x-session-id'];

    await this.analyticsService.trackSearch(
      searchDto.q || '',
      {
        type: searchDto.type,
        minPrice: searchDto.minPrice,
        maxPrice: searchDto.maxPrice,
        beds: searchDto.beds,
        baths: searchDto.baths,
        community: searchDto.community,
        purpose: searchDto.purpose,
      },
      results.total,
      userId,
      sessionId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: results,
    };
  }

  @Get('autocomplete')
  async autocomplete(@Query() autocompleteDto: AutocompleteDto) {
    const suggestions = await this.searchQueryService.autocomplete(
      autocompleteDto.q,
    );

    return {
      statusCode: HttpStatus.OK,
      data: suggestions,
    };
  }

  @Get('similar/:propertyId')
  async getSimilarProperties(@Param('propertyId') propertyId: string) {
    const properties = await this.searchQueryService.similarProperties(
      propertyId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: properties,
    };
  }

  @Get('geo/radius')
  async searchByRadius(@Query() geoSearchDto: GeoSearchDto) {
    const properties = await this.geoSearchService.searchByRadius(
      geoSearchDto.lat,
      geoSearchDto.lng,
      geoSearchDto.radius,
    );

    return {
      statusCode: HttpStatus.OK,
      data: properties,
    };
  }

  @Get('geo/bounds')
  async searchByBounds(@Query() boundsDto: GeoBoundsDto) {
    const properties = await this.geoSearchService.searchByBounds({
      topLeft: { lat: boundsDto.topLat, lon: boundsDto.topLng },
      bottomRight: { lat: boundsDto.bottomLat, lon: boundsDto.bottomLng },
    });

    return {
      statusCode: HttpStatus.OK,
      data: properties,
    };
  }

  @Get('geo/cluster')
  async clusterProperties(@Query() clusterDto: ClusterPropertiesDto) {
    const clusters = await this.geoSearchService.clusterProperties(
      clusterDto.zoomLevel,
      {
        topLeft: { lat: clusterDto.topLat, lon: clusterDto.topLng },
        bottomRight: { lat: clusterDto.bottomLat, lon: clusterDto.bottomLng },
      },
    );

    return {
      statusCode: HttpStatus.OK,
      data: clusters,
    };
  }

  @Get('geo/landmark/:name')
  async searchNearLandmark(@Param('name') name: string) {
    const properties = await this.geoSearchService.searchNearLandmark(name);

    return {
      statusCode: HttpStatus.OK,
      data: properties,
    };
  }

  @Post('index/property/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.CREATED)
  async indexProperty(@Param('id') id: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['agent'],
    });

    if (!property) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Property not found',
      };
    }

    const documentId = await this.indexService.indexProperty(property);

    return {
      statusCode: HttpStatus.CREATED,
      data: {
        documentId,
        propertyId: id,
        message: 'Property indexed successfully',
      },
    };
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.ACCEPTED)
  async reindexAll() {
    // Create indices if they don't exist
    await this.indexService.createIndices();

    // Fetch all properties
    const properties = await this.propertyRepository.find({
      relations: ['agent'],
    });

    // Bulk index properties
    const result = await this.indexService.bulkIndex(
      properties,
      OPENSEARCH_PROPERTIES_INDEX,
      'property',
    );

    return {
      statusCode: HttpStatus.ACCEPTED,
      data: {
        message: 'Reindex completed',
        properties: result,
      },
    };
  }

  @Get('analytics/popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getPopularSearches(@Query('timeframe') timeframe?: '7d' | '30d') {
    const searches = await this.analyticsService.getPopularSearches(
      timeframe || '7d',
    );

    return {
      statusCode: HttpStatus.OK,
      data: searches,
    };
  }

  @Get('analytics/zero-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getZeroResultSearches(@Query('timeframe') timeframe?: '7d' | '30d') {
    const searches = await this.analyticsService.getZeroResultSearches(
      timeframe || '7d',
    );

    return {
      statusCode: HttpStatus.OK,
      data: searches,
    };
  }

  @Get('analytics/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getSearchMetrics(@Query('timeframe') timeframe?: '7d' | '30d') {
    const metrics = await this.analyticsService.getSearchMetrics(
      timeframe || '7d',
    );

    return {
      statusCode: HttpStatus.OK,
      data: metrics,
    };
  }

  @Get('analytics/conversion-rate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getSearchToContactRate(@Query('timeframe') timeframe?: '7d' | '30d') {
    const rate = await this.analyticsService.getSearchToContactRate(
      timeframe || '7d',
    );

    return {
      statusCode: HttpStatus.OK,
      data: rate,
    };
  }
}
