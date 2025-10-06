import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import {
  createOpenSearchClient,
  OPENSEARCH_PROPERTIES_INDEX,
  OPENSEARCH_LISTINGS_INDEX,
  propertiesIndexConfig,
  listingsIndexConfig,
} from '../config/opensearch.config';

export interface IndexStatus {
  success: boolean;
  index?: string;
  message?: string;
  error?: string;
}

export interface BulkIndexResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

@Injectable()
export class SearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexService.name);
  private client: Client;

  constructor() {
    this.client = createOpenSearchClient();
  }

  async onModuleInit() {
    try {
      // Test connection
      const health = await this.client.cluster.health();
      this.logger.log(`OpenSearch cluster health: ${health.body.status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to connect to OpenSearch:', errorMessage);
    }
  }

  async createIndices(): Promise<{ properties: IndexStatus; listings: IndexStatus }> {
    const propertiesResult = await this.createPropertiesIndex();
    const listingsResult = await this.createListingsIndex();

    return {
      properties: propertiesResult,
      listings: listingsResult,
    };
  }

  async createPropertiesIndex(): Promise<IndexStatus> {
    try {
      const indexExists = await this.client.indices.exists({
        index: OPENSEARCH_PROPERTIES_INDEX,
      });

      if (indexExists.body) {
        this.logger.log(`Index ${OPENSEARCH_PROPERTIES_INDEX} already exists`);
        return {
          success: true,
          index: OPENSEARCH_PROPERTIES_INDEX,
          message: 'Index already exists',
        };
      }

      await this.client.indices.create({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: propertiesIndexConfig as any,
      });

      this.logger.log(`Created index: ${OPENSEARCH_PROPERTIES_INDEX}`);
      return {
        success: true,
        index: OPENSEARCH_PROPERTIES_INDEX,
        message: 'Index created successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create properties index: ${errorMessage}`);
      return {
        success: false,
        index: OPENSEARCH_PROPERTIES_INDEX,
        error: errorMessage,
      };
    }
  }

  async createListingsIndex(): Promise<IndexStatus> {
    try {
      const indexExists = await this.client.indices.exists({
        index: OPENSEARCH_LISTINGS_INDEX,
      });

      if (indexExists.body) {
        this.logger.log(`Index ${OPENSEARCH_LISTINGS_INDEX} already exists`);
        return {
          success: true,
          index: OPENSEARCH_LISTINGS_INDEX,
          message: 'Index already exists',
        };
      }

      await this.client.indices.create({
        index: OPENSEARCH_LISTINGS_INDEX,
        body: listingsIndexConfig as any,
      });

      this.logger.log(`Created index: ${OPENSEARCH_LISTINGS_INDEX}`);
      return {
        success: true,
        index: OPENSEARCH_LISTINGS_INDEX,
        message: 'Index created successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create listings index: ${errorMessage}`);
      return {
        success: false,
        index: OPENSEARCH_LISTINGS_INDEX,
        error: errorMessage,
      };
    }
  }

  async indexProperty(property: any): Promise<string> {
    try {
      const document = this.transformPropertyToDocument(property);

      const response = await this.client.index({
        index: OPENSEARCH_PROPERTIES_INDEX,
        id: property.id,
        body: document,
        refresh: true,
      });

      this.logger.log(`Indexed property: ${property.id}`);
      return response.body._id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to index property ${property.id}: ${errorMessage}`);
      throw error;
    }
  }

  async indexListing(listing: any, property?: any): Promise<string> {
    try {
      const document = this.transformListingToDocument(listing, property);

      const response = await this.client.index({
        index: OPENSEARCH_LISTINGS_INDEX,
        id: listing.id,
        body: document,
        refresh: true,
      });

      this.logger.log(`Indexed listing: ${listing.id}`);
      return response.body._id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to index listing ${listing.id}: ${errorMessage}`);
      throw error;
    }
  }

  async bulkIndex(
    documents: any[],
    indexName: string,
    type: 'property' | 'listing',
  ): Promise<BulkIndexResult> {
    const result: BulkIndexResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const body = batch.flatMap((doc) => {
        const transformedDoc =
          type === 'property'
            ? this.transformPropertyToDocument(doc)
            : this.transformListingToDocument(doc, doc.property);

        return [{ index: { _index: indexName, _id: doc.id } }, transformedDoc];
      });

      try {
        const response = await this.client.bulk({ body, refresh: true });

        if (response.body.errors) {
          response.body.items.forEach((item: any, idx: number) => {
            if (item.index?.error) {
              result.failed++;
              result.errors.push({
                id: batch[idx].id,
                error: item.index.error.reason,
              });
            } else {
              result.successful++;
            }
          });
        } else {
          result.successful += batch.length;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Bulk index batch failed: ${errorMessage}`);
        result.failed += batch.length;
        batch.forEach((doc) => {
          result.errors.push({ id: doc.id, error: errorMessage });
        });
      }
    }

    this.logger.log(
      `Bulk index completed: ${result.successful} successful, ${result.failed} failed`,
    );
    return result;
  }

  async deleteFromIndex(documentId: string, indexName: string): Promise<boolean> {
    try {
      await this.client.delete({
        index: indexName,
        id: documentId,
        refresh: true,
      });

      this.logger.log(`Deleted document ${documentId} from ${indexName}`);
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'meta' in error) {
        const osError = error as any;
        if (osError.meta?.statusCode === 404) {
          this.logger.warn(`Document ${documentId} not found in ${indexName}`);
          return false;
        }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete document ${documentId}: ${errorMessage}`);
      throw error;
    }
  }

  async reindexAll(): Promise<{ properties: BulkIndexResult; listings: BulkIndexResult }> {
    this.logger.log('Starting full reindex...');

    // Delete existing indices
    try {
      await this.client.indices.delete({ index: OPENSEARCH_PROPERTIES_INDEX });
      await this.client.indices.delete({ index: OPENSEARCH_LISTINGS_INDEX });
    } catch (error) {
      // Indices may not exist
      this.logger.warn('Could not delete indices (may not exist)');
    }

    // Recreate indices
    await this.createIndices();

    // Note: Actual reindexing will be done by calling this with data from database
    // This is a placeholder for the reindex operation
    this.logger.log('Reindex preparation complete');

    return {
      properties: { successful: 0, failed: 0, errors: [] },
      listings: { successful: 0, failed: 0, errors: [] },
    };
  }

  private transformPropertyToDocument(property: any): any {
    return {
      propertyId: property.id,
      permitNumber: property.permitNumber,
      type: property.type,
      status: property.status,
      purpose: property.purpose,
      community: property.community,
      subCommunity: property.subCommunity,
      developer: property.developer,
      address: property.address,
      addressAr: property.addressAr,
      description: property.description,
      descriptionAr: property.descriptionAr,
      price: property.price,
      pricePerSqft: property.pricePerSqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      plotSizeSqft: property.plotSizeSqft,
      handoverDate: property.handoverDate,
      completionStatus: property.completionStatus,
      location:
        property.latitude && property.longitude
          ? {
              lat: property.latitude,
              lon: property.longitude,
            }
          : null,
      amenities: property.amenities || [],
      features: property.features || [],
      nearbyPlaces: property.nearbyPlaces || [],
      images: property.images || [],
      virtualTourUrl: property.virtualTourUrl,
      embedding: property.embedding || null,
      agentId: property.agent?.id,
      agentName: property.agent?.name,
      agentPhone: property.agent?.phone,
      agentEmail: property.agent?.email,
      viewCount: property.viewCount || 0,
      contactCount: property.contactCount || 0,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private transformListingToDocument(listing: any, property?: any): any {
    return {
      listingId: listing.id,
      propertyId: listing.property?.id || property?.id,
      permitNumber: listing.permitNumber,
      status: listing.status,
      visibility: listing.visibility,
      type: listing.property?.type || property?.type,
      purpose: listing.property?.purpose || property?.purpose,
      title: listing.title,
      titleAr: listing.titleAr,
      description: listing.description,
      descriptionAr: listing.descriptionAr,
      community: listing.property?.community || property?.community,
      developer: listing.property?.developer || property?.developer,
      price: listing.price || listing.property?.price || property?.price,
      bedrooms: listing.property?.bedrooms || property?.bedrooms,
      bathrooms: listing.property?.bathrooms || property?.bathrooms,
      areaSqft: listing.property?.areaSqft || property?.areaSqft,
      location:
        listing.property?.latitude && listing.property?.longitude
          ? {
              lat: listing.property.latitude,
              lon: listing.property.longitude,
            }
          : property?.latitude && property?.longitude
            ? {
                lat: property.latitude,
                lon: property.longitude,
              }
            : null,
      features: listing.features || listing.property?.features || property?.features || [],
      images: listing.images || listing.property?.images || property?.images || [],
      agentId: listing.agent?.id || listing.property?.agent?.id,
      agentName: listing.agent?.name || listing.property?.agent?.name,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  getClient(): Client {
    return this.client;
  }
}
