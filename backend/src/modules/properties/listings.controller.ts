import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Request,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UserRole } from '../auth/entities/user.entity';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createListingDto: CreateListingDto, @Req() req: Request) {
    return this.listingsService.createListing(createListingDto, (req as any)['user'].userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string, @Req() req: Request) {
    return this.listingsService.publishListing(id, (req as any)['user'].userId);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async search(@Query() searchDto: SearchListingsDto, @Req() req: Request) {
    return this.listingsService.searchListings(
      searchDto,
      (req as any)['user']?.userId,
      (req as any)['user']?.roles || [],
    );
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const incrementView = !(req as any)['user']; // Only increment for public requests
    return this.listingsService.getListingById(id, incrementView);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @Req() req: Request,
  ) {
    return this.listingsService.updateListing(
      id,
      updateListingDto,
      (req as any)['user'].userId,
      (req as any)['user'].roles || [],
    );
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id') id: string, @Req() req: Request) {
    return this.listingsService.archiveListing(id, (req as any)['user'].userId, (req as any)['user'].roles || []);
  }
}
