import { Client } from '@opensearch-project/opensearch';
import { searchAnalyzerSettings } from './analyzers';

export interface OpenSearchConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

export const getOpenSearchConfig = (): OpenSearchConfig => {
  return {
    node: process.env.OPENSEARCH_NODE || 'https://localhost:9200',
    auth: {
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || 'admin',
    },
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  };
};

export const createOpenSearchClient = (): Client => {
  const config = getOpenSearchConfig();
  return new Client(config);
};

export const propertiesIndexConfig = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    ...searchAnalyzerSettings,
  },
  mappings: {
    properties: {
      propertyId: { type: 'keyword' },
      permitNumber: { type: 'keyword' },
      type: { type: 'keyword' },
      status: { type: 'keyword' },
      purpose: { type: 'keyword' },
      community: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: { type: 'text', analyzer: 'autocomplete' },
        },
      },
      subCommunity: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
        },
      },
      developer: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: { type: 'text', analyzer: 'autocomplete' },
        },
      },
      address: {
        type: 'text',
        analyzer: 'bilingual',
      },
      addressAr: {
        type: 'text',
        analyzer: 'arabic',
      },
      description: {
        type: 'text',
        analyzer: 'bilingual',
      },
      descriptionAr: {
        type: 'text',
        analyzer: 'arabic',
      },
      price: { type: 'double' },
      pricePerSqft: { type: 'double' },
      bedrooms: { type: 'integer' },
      bathrooms: { type: 'float' },
      areaSqft: { type: 'double' },
      plotSizeSqft: { type: 'double' },
      handoverDate: { type: 'date' },
      completionStatus: { type: 'keyword' },
      location: { type: 'geo_point' },
      amenities: { type: 'keyword' },
      features: { type: 'keyword' },
      nearbyPlaces: {
        type: 'nested',
        properties: {
          name: { type: 'text', analyzer: 'bilingual' },
          type: { type: 'keyword' },
          distance: { type: 'float' },
        },
      },
      images: { type: 'keyword' },
      virtualTourUrl: { type: 'keyword' },
      embedding: {
        type: 'knn_vector',
        dimension: 768,
      },
      agentId: { type: 'keyword' },
      agentName: { type: 'text', analyzer: 'bilingual' },
      agentPhone: { type: 'keyword' },
      agentEmail: { type: 'keyword' },
      viewCount: { type: 'integer' },
      contactCount: { type: 'integer' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
};

export const listingsIndexConfig = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    ...searchAnalyzerSettings,
  },
  mappings: {
    properties: {
      listingId: { type: 'keyword' },
      propertyId: { type: 'keyword' },
      permitNumber: { type: 'keyword' },
      status: { type: 'keyword' },
      visibility: { type: 'keyword' },
      type: { type: 'keyword' },
      purpose: { type: 'keyword' },
      title: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
        },
      },
      titleAr: {
        type: 'text',
        analyzer: 'arabic',
      },
      description: {
        type: 'text',
        analyzer: 'bilingual',
      },
      descriptionAr: {
        type: 'text',
        analyzer: 'arabic',
      },
      community: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: { type: 'text', analyzer: 'autocomplete' },
        },
      },
      developer: {
        type: 'text',
        analyzer: 'bilingual',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: { type: 'text', analyzer: 'autocomplete' },
        },
      },
      price: { type: 'double' },
      bedrooms: { type: 'integer' },
      bathrooms: { type: 'float' },
      areaSqft: { type: 'double' },
      location: { type: 'geo_point' },
      features: { type: 'keyword' },
      images: { type: 'keyword' },
      agentId: { type: 'keyword' },
      agentName: { type: 'text', analyzer: 'bilingual' },
      publishedAt: { type: 'date' },
      expiresAt: { type: 'date' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
};

export const OPENSEARCH_PROPERTIES_INDEX =
  process.env.OPENSEARCH_INDEX_PROPERTIES || 'properties';
export const OPENSEARCH_LISTINGS_INDEX =
  process.env.OPENSEARCH_INDEX_LISTINGS || 'listings';
