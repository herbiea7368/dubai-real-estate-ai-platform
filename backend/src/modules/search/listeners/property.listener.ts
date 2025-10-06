import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchIndexService } from '../services/index.service';
import { OPENSEARCH_PROPERTIES_INDEX } from '../config/opensearch.config';

@Injectable()
export class PropertySearchListener {
  private readonly logger = new Logger(PropertySearchListener.name);

  constructor(private readonly indexService: SearchIndexService) {}

  @OnEvent('property.created')
  async handlePropertyCreated(property: any) {
    try {
      await this.indexService.indexProperty(property);
      this.logger.log(`Indexed new property: ${property.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to index property ${property.id}: ${errorMessage}`,
      );
    }
  }

  @OnEvent('property.updated')
  async handlePropertyUpdated(property: any) {
    try {
      await this.indexService.indexProperty(property);
      this.logger.log(`Updated property in index: ${property.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to update property ${property.id}: ${errorMessage}`,
      );
    }
  }

  @OnEvent('property.deleted')
  async handlePropertyDeleted(propertyId: string) {
    try {
      await this.indexService.deleteFromIndex(
        propertyId,
        OPENSEARCH_PROPERTIES_INDEX,
      );
      this.logger.log(`Deleted property from index: ${propertyId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete property ${propertyId}: ${errorMessage}`,
      );
    }
  }
}
