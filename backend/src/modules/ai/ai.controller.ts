import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { NLPService, BulkGenerationResult } from './services/nlp.service';
import { GenerateListingDto, Language, Tone } from './dto/generate-listing.dto';
import { TranslateContentDto } from './dto/translate-content.dto';
import { BulkGenerateDto } from './dto/bulk-generate.dto';
import { ValidateContentDto } from './dto/validate-content.dto';
import { Property } from '../properties/entities/property.entity';
import { Permit } from '../permits/entities/permit.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIController {
  constructor(
    private readonly nlpService: NLPService,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Permit)
    private readonly permitRepository: Repository<Permit>,
  ) {}

  /**
   * Generate listing description for a single property
   */
  @Post('listing-writer')
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.OK)
  async generateListing(@Body() dto: GenerateListingDto) {
    // Fetch property data
    const property = await this.propertyRepository.findOne({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Prepare property data for NLP service
    const propertyData = {
      type: property.type,
      beds: property.bedrooms,
      baths: property.bathrooms,
      area: property.areaSqft,
      community: property.community,
      amenities: property.amenities,
      price: property.priceAed,
      title: undefined, // Property entity doesn't have title
      features: undefined, // Property entity doesn't have features
    };

    const language = dto.language || Language.EN;
    const tone = dto.tone || Tone.PROFESSIONAL;

    // Generate description
    const result = await this.nlpService.generateListingDescription(
      propertyData,
      dto.trakheesiNumber,
      language,
      tone,
    );

    return {
      propertyId: dto.propertyId,
      description: result.description,
      language,
      tone,
      metadata: {
        toxicityFlag: result.toxicityFlag,
        readingLevel: result.readingLevel,
        warnings: result.warnings,
        wordCount: result.description.split(/\s+/).length,
      },
    };
  }

  /**
   * Translate content to target language
   */
  @Post('translate')
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.OK)
  async translateContent(@Body() dto: TranslateContentDto) {
    const result = await this.nlpService.translateDescription(
      dto.text,
      dto.targetLanguage,
    );

    return {
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
    };
  }

  /**
   * Bulk generate descriptions for multiple properties
   */
  @Post('bulk-generate')
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async bulkGenerate(@Body() dto: BulkGenerateDto): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: BulkGenerationResult[];
  }> {
    const language = dto.language || Language.EN;
    const tone = dto.tone || Tone.PROFESSIONAL;

    // Fetch all properties with their permits
    const properties = await this.propertyRepository.findByIds(dto.propertyIds);

    if (properties.length !== dto.propertyIds.length) {
      const foundIds = properties.map((p) => p.id);
      const missingIds = dto.propertyIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Properties not found: ${missingIds.join(', ')}`,
      );
    }

    // Prepare bulk data with Trakheesi numbers
    const bulkData = await Promise.all(
      properties.map(async (property) => {
        // Get Trakheesi permit for this property
        const permit = await this.permitRepository.findOne({
          where: { propertyId: property.id },
          order: { issueDate: 'DESC' },
        });

        if (!permit || !permit.trakheesiNumber) {
          throw new NotFoundException(
            `No Trakheesi permit found for property ${property.id}`,
          );
        }

        return {
          propertyId: property.id,
          propertyData: {
            type: property.type,
            beds: property.bedrooms,
            baths: property.bathrooms,
            area: property.areaSqft,
            community: property.community,
            amenities: property.amenities,
            price: property.priceAed,
            title: undefined,
            features: undefined,
          },
          trakheesiNumber: permit.trakheesiNumber,
        };
      }),
    );

    // Generate descriptions in bulk
    const results = await this.nlpService.generateBulkDescriptions(
      bulkData,
      language,
      tone,
    );

    return {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Validate content quality
   */
  @Post('validate-content')
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async validateContent(@Body() dto: ValidateContentDto) {
    // Detect language
    const language: 'en' | 'ar' = dto.text.match(/[\u0600-\u06FF]/)
      ? 'ar'
      : 'en';

    const validationResult = await this.nlpService.validateContent(
      dto.text,
      language,
    );

    return {
      valid: !validationResult.toxicityFlag && validationResult.warnings.length === 0,
      language,
      toxicityFlag: validationResult.toxicityFlag,
      readingLevel: validationResult.readingLevel,
      warnings: validationResult.warnings,
    };
  }
}
