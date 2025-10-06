import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchIndexService } from '../services/index.service';
import { OPENSEARCH_LISTINGS_INDEX } from '../config/opensearch.config';

@Injectable()
export class ListingSearchListener {
  private readonly logger = new Logger(ListingSearchListener.name);

  constructor(private readonly indexService: SearchIndexService) {}

  @OnEvent('listing.created')
  async handleListingCreated(listing: any) {
    try {
      await this.indexService.indexListing(listing, listing.property);
      this.logger.log(`Indexed new listing: ${listing.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to index listing ${listing.id}: ${errorMessage}`,
      );
    }
  }

  @OnEvent('listing.updated')
  async handleListingUpdated(listing: any) {
    try {
      await this.indexService.indexListing(listing, listing.property);
      this.logger.log(`Updated listing in index: ${listing.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to update listing ${listing.id}: ${errorMessage}`,
      );
    }
  }

  @OnEvent('listing.deleted')
  async handleListingDeleted(listingId: string) {
    try {
      await this.indexService.deleteFromIndex(
        listingId,
        OPENSEARCH_LISTINGS_INDEX,
      );
      this.logger.log(`Deleted listing from index: ${listingId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete listing ${listingId}: ${errorMessage}`,
      );
    }
  }
}
