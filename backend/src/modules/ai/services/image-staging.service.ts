import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import {
  StagedImage,
  StagingStyle,
  RoomType,
  ProcessingStatus,
} from '../entities/staged-image.entity';
import { ImageStorageService } from './image-storage.service';
import { transformImage } from '../utils/image-transformer';

export interface StageImageResult {
  id: string;
  stagedImageUrl: string;
  originalImageUrl: string;
  processingTimeMs: number;
}

export interface ComparisonData {
  original: string;
  staged: string;
  style: StagingStyle;
  roomType: RoomType;
  metadata: any;
}

export interface BatchStageResult {
  jobId: string;
  total: number;
  processing: number;
  queued: number;
}

@Injectable()
export class ImageStagingService {
  constructor(
    @InjectRepository(StagedImage)
    private stagedImageRepository: Repository<StagedImage>,
    private imageStorageService: ImageStorageService,
  ) {}

  /**
   * Stage a single image with AI transformation
   */
  async stageImage(
    imageUrl: string,
    style: StagingStyle,
    roomType: RoomType,
    listingId: string,
    userId: string,
  ): Promise<StageImageResult> {
    const startTime = Date.now();

    try {
      // Create initial record
      const stagedImage = new StagedImage();
      stagedImage.listingId = listingId;
      stagedImage.originalImageUrl = imageUrl;
      stagedImage.style = style;
      stagedImage.roomType = roomType;
      stagedImage.processingStatus = ProcessingStatus.PROCESSING;
      stagedImage.createdBy = userId;

      await this.stagedImageRepository.save(stagedImage);

      // Download original image
      const imageBuffer = await this.imageStorageService.downloadImage(imageUrl);

      // Transform image (placeholder AI transformation)
      const transformResult = await transformImage(imageBuffer, style, roomType);

      // Apply watermark
      const watermarkedBuffer = await this.applyWatermark(transformResult.buffer);

      // Upload staged image
      const stagedImageUrl = await this.imageStorageService.uploadImage(
        watermarkedBuffer,
        `staged-${Date.now()}.jpg`,
        `staging/staged/${listingId}`,
      );

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Update record
      stagedImage.stagedImageUrl = stagedImageUrl;
      stagedImage.processingStatus = ProcessingStatus.COMPLETED;
      stagedImage.processingTimeMs = processingTimeMs;
      stagedImage.watermarkApplied = true;
      stagedImage.metadata = {
        dimensions: {
          width: transformResult.metadata.width,
          height: transformResult.metadata.height,
        },
        format: transformResult.metadata.format,
        transformations: transformResult.metadata.transformations,
        fileSize: watermarkedBuffer.length,
      };

      await this.stagedImageRepository.save(stagedImage);

      return {
        id: stagedImage.id,
        stagedImageUrl: stagedImage.stagedImageUrl,
        originalImageUrl: stagedImage.originalImageUrl,
        processingTimeMs,
      };
    } catch (error) {
      // Update record with error
      const stagedImage = await this.stagedImageRepository.findOne({
        where: { listingId, originalImageUrl: imageUrl },
        order: { createdAt: 'DESC' },
      });

      if (stagedImage) {
        stagedImage.processingStatus = ProcessingStatus.FAILED;
        stagedImage.metadata = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await this.stagedImageRepository.save(stagedImage);
      }

      throw new BadRequestException(
        `Failed to stage image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Apply watermark to staged image
   * Adds text "AI-Staged - For Visualization Only" in English and Arabic
   */
  async applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 768;

    // Calculate watermark dimensions and position
    const fontSize = Math.floor(width * 0.025); // 2.5% of image width
    const padding = Math.floor(width * 0.02); // 2% padding

    // Create watermark text SVG
    const watermarkText = 'AI-Staged - For Visualization Only';
    const watermarkTextArabic = 'تصميم بالذكاء الاصطناعي - للتصور فقط';

    const svgWatermark = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            fill: white;
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: 0.7;
          }
        </style>
        <rect width="${width}" height="${height}" fill="transparent"/>
        <text x="${width - padding}" y="${height - padding - fontSize}" text-anchor="end" class="watermark">${watermarkText}</text>
        <text x="${width - padding}" y="${height - padding}" text-anchor="end" class="watermark">${watermarkTextArabic}</text>
      </svg>
    `;

    // Composite watermark onto image
    const watermarkedImage = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgWatermark),
          gravity: 'southeast',
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return watermarkedImage;
  }

  /**
   * Get comparison data for before/after view
   */
  async getComparisonData(stagedImageId: string): Promise<ComparisonData> {
    const stagedImage = await this.stagedImageRepository.findOne({
      where: { id: stagedImageId },
    });

    if (!stagedImage) {
      throw new NotFoundException('Staged image not found');
    }

    return {
      original: stagedImage.originalImageUrl,
      staged: stagedImage.stagedImageUrl || '',
      style: stagedImage.style,
      roomType: stagedImage.roomType,
      metadata: stagedImage.metadata,
    };
  }

  /**
   * Batch stage multiple images
   * Processes up to 10 concurrently, queues the rest
   */
  async batchStageImages(
    images: Array<{
      imageUrl: string;
      style: StagingStyle;
      roomType: RoomType;
    }>,
    listingId: string,
    userId: string,
  ): Promise<BatchStageResult> {
    const jobId = uuidv4();
    const concurrentLimit = 10;

    const processing = images.slice(0, concurrentLimit);
    const queued = images.slice(concurrentLimit);

    // Process first batch concurrently
    const processingPromises = processing.map((img) =>
      this.stageImage(img.imageUrl, img.style, img.roomType, listingId, userId),
    );

    // Execute in background (in real implementation, use a job queue like Bull)
    Promise.all(processingPromises).catch((error) => {
      console.error(`Batch job ${jobId} failed:`, error);
    });

    // TODO: Queue remaining images for background processing
    // In production, use Bull or similar job queue:
    /*
     * import { Queue } from 'bull';
     *
     * for (const img of queued) {
     *   await this.stagingQueue.add('stage-image', {
     *     imageUrl: img.imageUrl,
     *     style: img.style,
     *     roomType: img.roomType,
     *     listingId,
     *     userId,
     *     jobId,
     *   });
     * }
     */

    return {
      jobId,
      total: images.length,
      processing: processing.length,
      queued: queued.length,
    };
  }

  /**
   * Delete a staged image (soft delete)
   */
  async deleteStaging(stagedImageId: string): Promise<void> {
    const stagedImage = await this.stagedImageRepository.findOne({
      where: { id: stagedImageId },
    });

    if (!stagedImage) {
      throw new NotFoundException('Staged image not found');
    }

    // Soft delete
    stagedImage.deletedAt = new Date();
    await this.stagedImageRepository.save(stagedImage);

    // Optionally delete the staged file (keep original)
    if (stagedImage.stagedImageUrl) {
      await this.imageStorageService.deleteImage(stagedImage.stagedImageUrl);
    }
  }

  /**
   * Get all staged images for a listing
   */
  async getStagingsByListing(listingId: string): Promise<StagedImage[]> {
    return this.stagedImageRepository.find({
      where: {
        listingId,
        deletedAt: null as any, // Type assertion for null check
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get staged image by ID
   */
  async getStagedImage(id: string): Promise<StagedImage> {
    const stagedImage = await this.stagedImageRepository.findOne({
      where: { id },
    });

    if (!stagedImage) {
      throw new NotFoundException('Staged image not found');
    }

    return stagedImage;
  }

  /**
   * Get job status (for batch operations)
   */
  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    status: string;
    results: StagedImage[];
  }> {
    // In production, retrieve from job queue
    // For MVP, return placeholder
    return {
      jobId,
      status: 'processing',
      results: [],
    };
  }
}
