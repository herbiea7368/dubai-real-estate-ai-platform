import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

@Injectable()
export class ImageStorageService {
  private readonly uploadDir: string;
  private readonly maxFileSizeMB: number;
  private readonly allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSizeMB = parseInt(
      this.configService.get('IMAGE_MAX_SIZE_MB', '10'),
      10,
    );
  }

  /**
   * Upload an image to storage
   * For MVP: Stores locally in /uploads directory
   * For production: Document S3 integration
   */
  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    folder: string,
  ): Promise<string> {
    // Ensure upload directory exists
    const targetDir = path.join(this.uploadDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const filePath = path.join(targetDir, uniqueFilename);

    // Write file to disk
    await fs.writeFile(filePath, imageBuffer);

    // Return public URL
    // For local storage: relative path
    // For S3: would return full S3 URL
    return `/uploads/${folder}/${uniqueFilename}`;

    /*
     * Production S3 Integration:
     *
     * import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
     *
     * const s3Client = new S3Client({
     *   region: this.configService.get('AWS_REGION'),
     *   credentials: {
     *     accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
     *     secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
     *   },
     * });
     *
     * const bucket = this.configService.get('AWS_S3_BUCKET');
     * const key = `${folder}/${uniqueFilename}`;
     *
     * const command = new PutObjectCommand({
     *   Bucket: bucket,
     *   Key: key,
     *   Body: imageBuffer,
     *   ContentType: 'image/jpeg',
     *   ACL: 'public-read',
     * });
     *
     * await s3Client.send(command);
     *
     * return `https://${bucket}.s3.amazonaws.com/${key}`;
     *
     * Bucket structure:
     * /staging/original/{listingId}/{filename}
     * /staging/staged/{listingId}/{filename}
     */
  }

  /**
   * Download an image from URL to buffer
   * Validates file type and size
   */
  async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      // Handle both local and remote URLs
      let imageBuffer: Buffer;

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Download from remote URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new BadRequestException(
            `Failed to download image: ${response.statusText}`,
          );
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else if (imageUrl.startsWith('/uploads/')) {
        // Read from local storage
        const localPath = path.join(process.cwd(), imageUrl);
        imageBuffer = await fs.readFile(localPath);
      } else {
        throw new BadRequestException('Invalid image URL format');
      }

      // Validate file size
      const fileSizeMB = imageBuffer.length / (1024 * 1024);
      if (fileSizeMB > this.maxFileSizeMB) {
        throw new BadRequestException(
          `Image size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${this.maxFileSizeMB}MB)`,
        );
      }

      // Validate file type using sharp
      const metadata = await sharp(imageBuffer).metadata();
      if (!metadata.format || !this.allowedFormats.includes(metadata.format)) {
        throw new BadRequestException(
          `Invalid image format. Allowed formats: ${this.allowedFormats.join(', ')}`,
        );
      }

      return imageBuffer;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete an image from storage
   * For MVP: Deletes from local filesystem
   * For production: Deletes from S3
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), imageUrl);
        await fs.unlink(localPath);
      }
      // For S3, would use DeleteObjectCommand
      /*
       * import { DeleteObjectCommand } from '@aws-sdk/client-s3';
       *
       * const bucket = this.configService.get('AWS_S3_BUCKET');
       * const key = imageUrl.replace(`https://${bucket}.s3.amazonaws.com/`, '');
       *
       * const command = new DeleteObjectCommand({
       *   Bucket: bucket,
       *   Key: key,
       * });
       *
       * await s3Client.send(command);
       */
    } catch (error) {
      // Log but don't throw - allow deletion to continue even if file doesn't exist
      console.error(
        `Failed to delete image ${imageUrl}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
    };
  }
}
