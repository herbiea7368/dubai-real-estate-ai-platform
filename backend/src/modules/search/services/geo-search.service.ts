import { Injectable, Logger } from '@nestjs/common';
import { SearchIndexService } from './index.service';
import { OPENSEARCH_PROPERTIES_INDEX } from '../config/opensearch.config';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface BoundingBox {
  topLeft: GeoPoint;
  bottomRight: GeoPoint;
}

export interface PropertyWithDistance {
  id: string;
  distance: string;
  distanceKm: number;
  [key: string]: any;
}

export interface ClusterPoint {
  location: GeoPoint;
  count: number;
  properties: string[];
}

@Injectable()
export class GeoSearchService {
  private readonly logger = new Logger(GeoSearchService.name);

  // Landmark coordinates for Dubai
  private readonly landmarks: { [key: string]: GeoPoint } = {
    'burj khalifa': { lat: 25.1972, lon: 55.2744 },
    'dubai mall': { lat: 25.1976, lon: 55.2796 },
    'dubai marina': { lat: 25.0805, lon: 55.1396 },
    'palm jumeirah': { lat: 25.1124, lon: 55.1390 },
    'downtown dubai': { lat: 25.1972, lon: 55.2744 },
    'jbr': { lat: 25.0784, lon: 55.1326 },
    'jumeirah beach residence': { lat: 25.0784, lon: 55.1326 },
    'business bay': { lat: 25.1877, lon: 55.2644 },
    'dubai creek harbour': { lat: 25.1837, lon: 55.3491 },
    'city walk': { lat: 25.2124, lon: 55.2624 },
  };

  constructor(private readonly indexService: SearchIndexService) {}

  async searchByRadius(
    lat: number,
    lon: number,
    radiusKm: number = 5,
  ): Promise<PropertyWithDistance[]> {
    try {
      const client = this.indexService.getClient();

      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 50,
          query: {
            bool: {
              filter: {
                geo_distance: {
                  distance: `${radiusKm}km`,
                  location: {
                    lat,
                    lon,
                  },
                },
              },
            },
          },
          sort: [
            {
              _geo_distance: {
                location: {
                  lat,
                  lon,
                },
                order: 'asc',
                unit: 'km',
              },
            },
          ],
        },
      });

      const hits = response.body.hits.hits;

      return hits.map((hit: any) => {
        const distanceKm = hit.sort ? hit.sort[0] : null;
        return {
          id: hit._id,
          distance: distanceKm ? `${distanceKm.toFixed(2)} km` : 'N/A',
          distanceKm: distanceKm || 0,
          ...hit._source,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Geo radius search failed: ${errorMessage}`);
      throw error;
    }
  }

  async searchByBounds(bounds: BoundingBox): Promise<any[]> {
    try {
      const client = this.indexService.getClient();

      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 100,
          query: {
            bool: {
              filter: {
                geo_bounding_box: {
                  location: {
                    top_left: {
                      lat: bounds.topLeft.lat,
                      lon: bounds.topLeft.lon,
                    },
                    bottom_right: {
                      lat: bounds.bottomRight.lat,
                      lon: bounds.bottomRight.lon,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const hits = response.body.hits.hits;

      return hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Geo bounds search failed: ${errorMessage}`);
      throw error;
    }
  }

  async searchNearLandmark(landmarkName: string): Promise<PropertyWithDistance[]> {
    const normalizedName = landmarkName.toLowerCase().trim();
    const landmark = this.landmarks[normalizedName];

    if (!landmark) {
      // Try to find a partial match
      const partialMatch = Object.keys(this.landmarks).find((key) =>
        key.includes(normalizedName) || normalizedName.includes(key),
      );

      if (partialMatch) {
        return this.searchByRadius(
          this.landmarks[partialMatch].lat,
          this.landmarks[partialMatch].lon,
          5,
        );
      }

      throw new Error(`Landmark "${landmarkName}" not found`);
    }

    return this.searchByRadius(landmark.lat, landmark.lon, 5);
  }

  async clusterProperties(
    zoomLevel: number,
    bounds: BoundingBox,
  ): Promise<ClusterPoint[]> {
    try {
      const client = this.indexService.getClient();

      // Calculate precision based on zoom level
      // Higher zoom = more precision = more clusters
      const precision = Math.min(Math.max(zoomLevel - 8, 1), 12);

      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 0,
          query: {
            bool: {
              filter: {
                geo_bounding_box: {
                  location: {
                    top_left: {
                      lat: bounds.topLeft.lat,
                      lon: bounds.topLeft.lon,
                    },
                    bottom_right: {
                      lat: bounds.bottomRight.lat,
                      lon: bounds.bottomRight.lon,
                    },
                  },
                },
              },
            },
          },
          aggs: {
            clusters: {
              geohash_grid: {
                field: 'location',
                precision: precision,
              },
              aggs: {
                centroid: {
                  geo_centroid: {
                    field: 'location',
                  },
                },
                top_properties: {
                  top_hits: {
                    size: 10,
                    _source: ['propertyId'],
                  },
                },
              },
            },
          },
        },
      });

      const aggs = response.body.aggregations;
      const buckets = (aggs?.clusters && 'buckets' in aggs.clusters)
        ? (aggs.clusters as any).buckets || []
        : [];

      return buckets.map((bucket: any) => ({
        location: {
          lat: bucket.centroid.location.lat,
          lon: bucket.centroid.location.lon,
        },
        count: bucket.doc_count,
        properties: bucket.top_properties.hits.hits.map(
          (hit: any) => hit._source.propertyId,
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Property clustering failed: ${errorMessage}`);
      throw error;
    }
  }

  async getPropertiesInPolygon(coordinates: GeoPoint[]): Promise<any[]> {
    try {
      const client = this.indexService.getClient();

      const response = await client.search({
        index: OPENSEARCH_PROPERTIES_INDEX,
        body: {
          size: 100,
          query: {
            bool: {
              filter: {
                geo_polygon: {
                  location: {
                    points: coordinates.map((coord) => ({
                      lat: coord.lat,
                      lon: coord.lon,
                    })),
                  },
                },
              },
            },
          },
        },
      });

      const hits = response.body.hits.hits;

      return hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Geo polygon search failed: ${errorMessage}`);
      throw error;
    }
  }

  getLandmarks(): { [key: string]: GeoPoint } {
    return this.landmarks;
  }

  addLandmark(name: string, location: GeoPoint): void {
    this.landmarks[name.toLowerCase()] = location;
  }
}
