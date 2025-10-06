import { Injectable, Logger } from '@nestjs/common';
import { SearchIndexService } from './index.service';
import { OPENSEARCH_PROPERTIES_INDEX } from '../config/opensearch.config';

export interface SearchParams {
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  community?: string;
  purpose?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface SearchResult {
  results: any[];
  total: number;
  page: number;
  limit: number;
  aggregations?: any;
}

export interface Suggestion {
  text: string;
  type: string;
  score?: number;
}

@Injectable()
export class SearchQueryService {
  private readonly logger = new Logger(SearchQueryService.name);

  constructor(private readonly indexService: SearchIndexService) {}

  async searchProperties(params: SearchParams): Promise<SearchResult> {
    const {
      q = '',
      type,
      minPrice,
      maxPrice,
      beds,
      baths,
      community,
      purpose,
      page = 1,
      limit = 20,
      sort = 'relevance',
    } = params;

    const from = (page - 1) * limit;

    // Build query
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    // Text search across multiple fields
    if (q && q.trim() !== '') {
      mustClauses.push({
        multi_match: {
          query: q,
          fields: [
            'community^3',
            'developer^2',
            'description^1.5',
            'address',
            'descriptionAr^1.5',
            'addressAr',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Filters
    if (type) {
      filterClauses.push({ term: { type } });
    }

    if (purpose) {
      filterClauses.push({ term: { purpose } });
    }

    if (community) {
      filterClauses.push({ term: { 'community.keyword': community } });
    }

    if (beds !== undefined) {
      filterClauses.push({ term: { bedrooms: beds } });
    }

    if (baths !== undefined) {
      filterClauses.push({ range: { bathrooms: { gte: baths } } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      filterClauses.push({ range: { price: priceRange } });
    }

    // Build sort
    const sortOptions = this.buildSortOptions(sort);

    try {
      const client = this.indexService.getClient();
      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
              filter: filterClauses,
            },
          },
          sort: sortOptions,
        },
      });

      const hits = response.body.hits.hits;
      const totalHits = response.body.hits.total;
      const total = typeof totalHits === 'number' ? totalHits : totalHits?.value || 0;

      return {
        results: hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Search failed: ${errorMessage}`);
      throw error;
    }
  }

  async hybridSearch(params: SearchParams): Promise<SearchResult> {
    const {
      q = '',
      type,
      minPrice,
      maxPrice,
      beds,
      baths,
      community,
      purpose,
      page = 1,
      limit = 20,
    } = params;

    const from = (page - 1) * limit;

    // Build filter clauses
    const filterClauses: any[] = [];

    if (type) filterClauses.push({ term: { type } });
    if (purpose) filterClauses.push({ term: { purpose } });
    if (community) filterClauses.push({ term: { 'community.keyword': community } });
    if (beds !== undefined) filterClauses.push({ term: { bedrooms: beds } });
    if (baths !== undefined) filterClauses.push({ range: { bathrooms: { gte: baths } } });
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      filterClauses.push({ range: { price: priceRange } });
    }

    try {
      const client = this.indexService.getClient();

      // Keyword search (BM25)
      const keywordQuery: any = {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: ['community^3', 'developer^2', 'description^1.5', 'address'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: filterClauses,
        },
      };

      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          from,
          size: limit,
          query: keywordQuery,
        },
      });

      // For now, we only use keyword search
      // Vector/semantic search would be added here with embeddings
      // Combined scoring: 70% keyword, 30% semantic

      const hits = response.body.hits.hits;
      const totalHits = response.body.hits.total;
      const total = typeof totalHits === 'number' ? totalHits : totalHits?.value || 0;

      return {
        results: hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Hybrid search failed: ${errorMessage}`);
      throw error;
    }
  }

  async autocomplete(query: string): Promise<Suggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const client = this.indexService.getClient();

      // Search for communities and developers
      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 0,
          aggs: {
            communities: {
              terms: {
                field: 'community.keyword',
                size: 10,
                order: { _count: 'desc' },
              },
            },
            developers: {
              terms: {
                field: 'developer.keyword',
                size: 10,
                order: { _count: 'desc' },
              },
            },
          },
          query: {
            bool: {
              should: [
                { prefix: { 'community.keyword': query } },
                { prefix: { 'developer.keyword': query } },
                { match: { community: { query, fuzziness: 'AUTO' } } },
                { match: { developer: { query, fuzziness: 'AUTO' } } },
              ],
            },
          },
        },
      });

      const suggestions: Suggestion[] = [];
      const aggs = response.body.aggregations;

      // Add community suggestions
      if (aggs?.communities && 'buckets' in aggs.communities) {
        const communitiesAgg = aggs.communities as any;
        communitiesAgg.buckets?.forEach((bucket: any) => {
          if (bucket.key.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              text: bucket.key,
              type: 'community',
              score: bucket.doc_count,
            });
          }
        });
      }

      // Add developer suggestions
      if (aggs?.developers && 'buckets' in aggs.developers) {
        const developersAgg = aggs.developers as any;
        developersAgg.buckets?.forEach((bucket: any) => {
          if (bucket.key.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              text: bucket.key,
              type: 'developer',
              score: bucket.doc_count,
            });
          }
        });
      }

      // Sort by score and limit to 10
      return suggestions.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Autocomplete failed: ${errorMessage}`);
      return [];
    }
  }

  async searchWithFacets(params: SearchParams): Promise<SearchResult> {
    const {
      q = '',
      type,
      minPrice,
      maxPrice,
      beds,
      baths,
      community,
      purpose,
      page = 1,
      limit = 20,
      sort = 'relevance',
    } = params;

    const from = (page - 1) * limit;

    // Build query
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    if (q && q.trim() !== '') {
      mustClauses.push({
        multi_match: {
          query: q,
          fields: ['community^3', 'developer^2', 'description^1.5', 'address'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (type) filterClauses.push({ term: { type } });
    if (purpose) filterClauses.push({ term: { purpose } });
    if (community) filterClauses.push({ term: { 'community.keyword': community } });
    if (beds !== undefined) filterClauses.push({ term: { bedrooms: beds } });
    if (baths !== undefined) filterClauses.push({ range: { bathrooms: { gte: baths } } });
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      filterClauses.push({ range: { price: priceRange } });
    }

    const sortOptions = this.buildSortOptions(sort);

    try {
      const client = this.indexService.getClient();
      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
              filter: filterClauses,
            },
          },
          sort: sortOptions,
          aggs: {
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { key: '0-1M', to: 1000000 },
                  { key: '1M-2M', from: 1000000, to: 2000000 },
                  { key: '2M-5M', from: 2000000, to: 5000000 },
                  { key: '5M+', from: 5000000 },
                ],
              },
            },
            communities: {
              terms: {
                field: 'community.keyword',
                size: 10,
                order: { _count: 'desc' },
              },
            },
            property_types: {
              terms: {
                field: 'type',
                size: 10,
              },
            },
            bedrooms: {
              terms: {
                field: 'bedrooms',
                size: 10,
              },
            },
            purpose: {
              terms: {
                field: 'purpose',
                size: 2,
              },
            },
          },
        },
      });

      const hits = response.body.hits.hits;
      const totalHits = response.body.hits.total;
      const total = typeof totalHits === 'number' ? totalHits : totalHits?.value || 0;

      return {
        results: hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        })),
        total,
        page,
        limit,
        aggregations: response.body.aggregations,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Search with facets failed: ${errorMessage}`);
      throw error;
    }
  }

  async similarProperties(propertyId: string): Promise<any[]> {
    try {
      const client = this.indexService.getClient();

      // Get the property first
      const propertyResponse = await client.get({
        index: OPENSEARCH_PROPERTIES_INDEX,
        id: propertyId,
      });

      const property = propertyResponse.body._source;

      if (!property) {
        this.logger.warn(`Property ${propertyId} not found`);
        return [];
      }

      // Build "more like this" query
      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 5,
          query: {
            bool: {
              must: [
                {
                  more_like_this: {
                    fields: ['community', 'type', 'description'],
                    like: [
                      {
                        _index: OPENSEARCH_PROPERTIES_INDEX,
                        _id: propertyId,
                      },
                    ],
                    min_term_freq: 1,
                    min_doc_freq: 1,
                  },
                },
              ],
              filter: [
                { term: { type: property.type } },
                {
                  range: {
                    price: {
                      gte: property.price * 0.7,
                      lte: property.price * 1.3,
                    },
                  },
                },
              ],
              must_not: [{ term: { propertyId: propertyId } }],
            },
          },
        },
      });

      const hits = response.body.hits.hits;
      return hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Similar properties search failed: ${errorMessage}`);
      throw error;
    }
  }

  private buildSortOptions(sort: string): any[] {
    switch (sort) {
      case 'price_asc':
        return [{ price: { order: 'asc' } }];
      case 'price_desc':
        return [{ price: { order: 'desc' } }];
      case 'date_desc':
        return [{ createdAt: { order: 'desc' } }];
      case 'relevance':
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }
}
