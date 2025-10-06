import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Property, PropertyStatus } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `PROP-${year}-${random}`;
  }

  async createProperty(createPropertyDto: CreatePropertyDto, agentId: string): Promise<Property> {
    let referenceNumber = this.generateReferenceNumber();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure unique reference number
    while (attempts < maxAttempts) {
      const existing = await this.propertiesRepository.findOne({
        where: { referenceNumber },
      });
      if (!existing) break;
      referenceNumber = this.generateReferenceNumber();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new BadRequestException('Unable to generate unique reference number');
    }

    const property = this.propertiesRepository.create({
      ...createPropertyDto,
      referenceNumber,
      agentId,
    });

    return this.propertiesRepository.save(property);
  }

  async updateProperty(
    propertyId: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
    userRoles: string[],
  ): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
      relations: ['agent'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check ownership: only creator or compliance can update
    if (
      property.agentId !== userId &&
      !userRoles.includes('compliance') &&
      !userRoles.includes('admin')
    ) {
      throw new ForbiddenException('You do not have permission to update this property');
    }

    Object.assign(property, updatePropertyDto);

    return this.propertiesRepository.save(property);
  }

  async searchProperties(
    searchDto: SearchPropertiesDto,
  ): Promise<{ results: Property[]; total: number; page: number }> {
    const {
      type,
      community,
      minPrice,
      maxPrice,
      beds,
      purpose,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    const where: FindOptionsWhere<Property> = {};

    if (type) where.type = type;
    if (community) where.community = community;
    if (beds !== undefined) where.bedrooms = beds;
    if (purpose) where.purpose = purpose;
    if (status) {
      if (Array.isArray(status)) {
        where.status = In(status);
      } else {
        where.status = status;
      }
    }

    const queryBuilder = this.propertiesRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.agent', 'agent')
      .where(where);

    if (minPrice !== undefined) {
      queryBuilder.andWhere('property.priceAed >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('property.priceAed <= :maxPrice', { maxPrice });
    }

    const total = await queryBuilder.getCount();

    const validSortFields = ['priceAed', 'createdAt', 'areaSqft'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder
      .orderBy(`property.${sortField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const results = await queryBuilder.getMany();

    return {
      results,
      total,
      page,
    };
  }

  async getPropertyById(propertyId: string, incrementView = false): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
      relations: ['agent', 'listings'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (incrementView) {
      // Increment view count asynchronously without blocking response
      this.propertiesRepository.increment({ id: propertyId }, 'viewCount', 1).catch(() => {
        // Silent fail for view counting
      });
    }

    return property;
  }

  async deleteProperty(propertyId: string, userId: string, userRoles: string[]): Promise<void> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only creator, compliance, or admin can delete
    if (
      property.agentId !== userId &&
      !userRoles.includes('compliance') &&
      !userRoles.includes('admin')
    ) {
      throw new ForbiddenException('You do not have permission to delete this property');
    }

    // Soft delete by setting status to off_market
    property.status = PropertyStatus.OFF_MARKET;
    await this.propertiesRepository.save(property);
  }

  async findByAgent(agentId: string): Promise<Property[]> {
    return this.propertiesRepository.find({
      where: { agentId },
      relations: ['listings'],
      order: { createdAt: 'DESC' },
    });
  }
}
