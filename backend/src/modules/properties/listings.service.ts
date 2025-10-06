import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { Property } from './entities/property.entity';
import { PermitsService } from '../permits/permits.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private permitsService: PermitsService,
  ) {}

  async createListing(createListingDto: CreateListingDto, userId: string): Promise<Listing> {
    const { propertyId, trakheesiNumber, ...listingData } = createListingDto;

    // Get property to extract market
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate permit for listing
    const permitValidation = await this.permitsService.validatePermitForListing(
      trakheesiNumber,
      propertyId,
      property.market,
    );

    if (!permitValidation.isValid) {
      throw new BadRequestException({
        message: 'Permit validation failed',
        errors: permitValidation.errors,
        permitDetails: permitValidation.permit
          ? {
              status: permitValidation.permit.status,
              expiryDate: permitValidation.permit.expiryDate,
            }
          : undefined,
      });
    }

    const listing = this.listingsRepository.create({
      ...listingData,
      propertyId,
      permitId: permitValidation.permit!.id,
      createdBy: userId,
      status: ListingStatus.DRAFT,
    });

    return this.listingsRepository.save(listing);
  }

  async publishListing(listingId: string, _userId: string): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
      relations: ['property', 'creator'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Re-validate permit before publishing
    const permit = await this.permitsService.getPermitById(listing.permitId);
    const validation = await this.permitsService.validatePermitForListing(
      permit.trakheesiNumber,
      listing.propertyId,
      listing.property.market,
    );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Permit is no longer valid for publishing',
        errors: validation.errors,
        permitDetails: {
          status: permit.status,
          expiryDate: permit.expiryDate,
        },
      });
    }

    listing.status = ListingStatus.PUBLISHED;
    listing.publishedAt = new Date();

    // Add default channels if not specified
    if (!listing.publishedChannels || listing.publishedChannels.length === 0) {
      listing.publishedChannels = ['website'];
    }

    return this.listingsRepository.save(listing);
  }

  async updateListing(
    listingId: string,
    updateListingDto: UpdateListingDto,
    userId: string,
    userRoles: string[],
  ): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
      relations: ['property'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check ownership
    if (
      listing.createdBy !== userId &&
      !userRoles.includes('compliance') &&
      !userRoles.includes('admin')
    ) {
      throw new ForbiddenException('You do not have permission to update this listing');
    }

    // If permit is being changed and listing is published, re-validate
    if (updateListingDto.trakheesiNumber && listing.status === ListingStatus.PUBLISHED) {
      const validation = await this.permitsService.validatePermitForListing(
        updateListingDto.trakheesiNumber,
        listing.propertyId,
        listing.property.market,
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'New permit is not valid for publishing',
          errors: validation.errors,
          permitDetails: validation.permit
            ? {
                status: validation.permit.status,
                expiryDate: validation.permit.expiryDate,
              }
            : undefined,
        });
      }

      listing.permitId = validation.permit!.id;
    }

    Object.assign(listing, updateListingDto);

    return this.listingsRepository.save(listing);
  }

  async getListingById(listingId: string, incrementView = false): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
      relations: ['property', 'property.agent', 'creator'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get permit details with validation status
    if (listing.permitId) {
      const permit = await this.permitsService.getPermitById(listing.permitId);
      const validation = await this.permitsService.validatePermitForListing(
        permit.trakheesiNumber,
        listing.propertyId,
        listing.property.market,
      );
      (listing as any).permit = {
        ...permit,
        validationStatus: validation,
      };
    }

    if (incrementView) {
      // Increment view count asynchronously
      this.listingsRepository.increment({ id: listingId }, 'viewCount', 1).catch(() => {
        // Silent fail
      });
    }

    return listing;
  }

  async archiveListing(listingId: string, userId: string, userRoles: string[]): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check ownership
    if (
      listing.createdBy !== userId &&
      !userRoles.includes('compliance') &&
      !userRoles.includes('admin')
    ) {
      throw new ForbiddenException('You do not have permission to archive this listing');
    }

    listing.status = ListingStatus.ARCHIVED;
    listing.publishedChannels = [];

    return this.listingsRepository.save(listing);
  }

  async searchListings(
    searchDto: SearchListingsDto,
    userId?: string,
    userRoles: string[] = [],
  ): Promise<{ results: Listing[]; total: number; page: number }> {
    const {
      type,
      community,
      minPrice,
      maxPrice,
      beds,
      purpose,
      language,
      badges,
      publishedChannels,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    const queryBuilder = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.property', 'property')
      .leftJoinAndSelect('property.agent', 'agent')
      .leftJoinAndSelect('listing.creator', 'creator');

    // Public users only see published listings
    if (!userId) {
      queryBuilder.where('listing.status = :status', {
        status: ListingStatus.PUBLISHED,
      });
    } else {
      // Authenticated users see published + own drafts (unless compliance/admin)
      if (userRoles.includes('compliance') || userRoles.includes('admin')) {
        // Compliance and admin see all
      } else {
        queryBuilder.where(
          '(listing.status = :published OR (listing.createdBy = :userId AND listing.status IN (:...ownStatuses)))',
          {
            published: ListingStatus.PUBLISHED,
            userId,
            ownStatuses: [ListingStatus.DRAFT, ListingStatus.PENDING_REVIEW],
          },
        );
      }
    }

    // Property filters
    if (type) {
      queryBuilder.andWhere('property.type = :type', { type });
    }
    if (community) {
      queryBuilder.andWhere('property.community = :community', { community });
    }
    if (beds !== undefined) {
      queryBuilder.andWhere('property.bedrooms = :beds', { beds });
    }
    if (purpose) {
      queryBuilder.andWhere('property.purpose = :purpose', { purpose });
    }
    if (minPrice !== undefined) {
      queryBuilder.andWhere('property.priceAed >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('property.priceAed <= :maxPrice', { maxPrice });
    }

    // Listing-specific filters
    if (language) {
      queryBuilder.andWhere('listing.language = :language', { language });
    }
    if (badges && badges.length > 0) {
      queryBuilder.andWhere('listing.badges && :badges', { badges });
    }
    if (publishedChannels && publishedChannels.length > 0) {
      queryBuilder.andWhere('listing.publishedChannels && :publishedChannels', {
        publishedChannels,
      });
    }

    const total = await queryBuilder.getCount();

    const validSortFields = ['createdAt', 'publishedAt', 'viewCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder
      .orderBy(`listing.${sortField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const results = await queryBuilder.getMany();

    return {
      results,
      total,
      page,
    };
  }

  async incrementContactCount(listingId: string): Promise<void> {
    await this.listingsRepository.increment({ id: listingId }, 'contactCount', 1);
  }
}
