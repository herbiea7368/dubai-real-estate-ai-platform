import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ImageStagingService } from './services/image-staging.service';
import { StageImageDto } from './dto/stage-image.dto';
import { BatchStageDto } from './dto/batch-stage.dto';

@Controller('ai')
export class StagingController {
  constructor(private readonly imageStagingService: ImageStagingService) {}

  /**
   * POST /ai/stage-image
   * Stage a single image with AI transformation
   */
  @Post('stage-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.ACCEPTED)
  async stageImage(@Body() dto: StageImageDto, @Request() req: any) {
    const result = await this.imageStagingService.stageImage(
      dto.imageUrl,
      dto.style,
      dto.roomType,
      dto.listingId,
      req.user.sub || req.user.id,
    );

    return {
      jobId: result.id,
      status: 'completed',
      estimatedTime: `${result.processingTimeMs}ms`,
      result,
    };
  }

  /**
   * POST /ai/stage-batch
   * Stage multiple images in batch
   */
  @Post('stage-batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING)
  @HttpCode(HttpStatus.ACCEPTED)
  async stageBatch(@Body() dto: BatchStageDto, @Request() req: any) {
    const result = await this.imageStagingService.batchStageImages(
      dto.images,
      dto.listingId,
      req.user.sub || req.user.id,
    );

    return result;
  }

  /**
   * GET /ai/staging/:id
   * Get staged image details
   */
  @Get('staging/:id')
  @UseGuards(JwtAuthGuard)
  async getStagedImage(@Param('id') id: string) {
    const stagedImage = await this.imageStagingService.getStagedImage(id);

    return {
      id: stagedImage.id,
      listingId: stagedImage.listingId,
      originalImageUrl: stagedImage.originalImageUrl,
      stagedImageUrl: stagedImage.stagedImageUrl,
      style: stagedImage.style,
      roomType: stagedImage.roomType,
      processingStatus: stagedImage.processingStatus,
      processingTimeMs: stagedImage.processingTimeMs,
      watermarkApplied: stagedImage.watermarkApplied,
      metadata: stagedImage.metadata,
      createdAt: stagedImage.createdAt,
    };
  }

  /**
   * GET /ai/staging/:id/comparison
   * Get comparison data for before/after view
   */
  @Get('staging/:id/comparison')
  @UseGuards(JwtAuthGuard)
  async getComparison(@Param('id') id: string) {
    return this.imageStagingService.getComparisonData(id);
  }

  /**
   * GET /ai/staging/listing/:listingId
   * Get all staged images for a listing
   */
  @Get('staging/listing/:listingId')
  @UseGuards(JwtAuthGuard)
  async getStagingsByListing(@Param('listingId') listingId: string) {
    const stagedImages =
      await this.imageStagingService.getStagingsByListing(listingId);

    return {
      total: stagedImages.length,
      images: stagedImages.map((img) => ({
        id: img.id,
        originalImageUrl: img.originalImageUrl,
        stagedImageUrl: img.stagedImageUrl,
        style: img.style,
        roomType: img.roomType,
        processingStatus: img.processingStatus,
        createdAt: img.createdAt,
      })),
    };
  }

  /**
   * DELETE /ai/staging/:id
   * Delete a staged image (soft delete)
   */
  @Delete('staging/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStaging(@Param('id') id: string) {
    await this.imageStagingService.deleteStaging(id);
  }

  /**
   * GET /ai/staging/job/:jobId
   * Get job status for batch operations
   */
  @Get('staging/job/:jobId')
  @UseGuards(JwtAuthGuard)
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.imageStagingService.getJobStatus(jobId);
  }
}
