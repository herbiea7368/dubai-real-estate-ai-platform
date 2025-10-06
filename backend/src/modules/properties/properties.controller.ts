import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Request,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UserRole } from '../auth/entities/user.entity';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Req() req: Request) {
    return this.propertiesService.createProperty(createPropertyDto, (req as any)['user'].userId);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async search(@Query() searchDto: SearchPropertiesDto) {
    return this.propertiesService.searchProperties(searchDto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const incrementView = !(req as any)['user']; // Only increment for public requests
    return this.propertiesService.getPropertyById(id, incrementView);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
  ) {
    return this.propertiesService.updateProperty(
      id,
      updatePropertyDto,
      (req as any)['user'].userId,
      (req as any)['user'].roles || [],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.COMPLIANCE, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.propertiesService.deleteProperty(id, (req as any)['user'].userId, (req as any)['user'].roles || []);
  }
}
