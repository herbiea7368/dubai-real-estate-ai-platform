# Search Guide

## Overview

The Dubai Real Estate AI Platform uses OpenSearch for advanced property search capabilities, including full-text search, filters, geo-spatial queries, and autocomplete.

## Basic Search

### Simple Text Search

**Endpoint:** `GET /search/properties`

**Query Parameters:**
- `q`: Search query text
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Example:**
```bash
curl "http://localhost:3000/search/properties?q=villa+palm+jumeirah&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "results": [
    {
      "id": "property-uuid",
      "type": "villa",
      "community": "Palm Jumeirah",
      "bedrooms": 5,
      "priceAed": 25000000,
      "score": 0.95,
      "highlight": {
        "titleEn": ["Luxury <em>Villa</em> in <em>Palm Jumeirah</em>"]
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

## Advanced Filtering

### Property Type Filter

```bash
curl "http://localhost:3000/search/properties?type=villa,penthouse"
```

### Price Range Filter

```bash
curl "http://localhost:3000/search/properties?priceMin=5000000&priceMax=30000000"
```

### Bedroom and Bathroom Filters

```bash
curl "http://localhost:3000/search/properties?bedrooms=4,5,6&bathrooms=4"
```

### Area Size Filter

```bash
curl "http://localhost:3000/search/properties?areaSqftMin=5000&areaSqftMax=10000"
```

### Community Filter

```bash
curl "http://localhost:3000/search/properties?community=Palm+Jumeirah,Dubai+Marina"
```

### Completion Status

```bash
curl "http://localhost:3000/search/properties?completionStatus=ready"
```

**Values:** `off_plan`, `under_construction`, `ready`

### Furnishing Status

```bash
curl "http://localhost:3000/search/properties?furnishing=fully_furnished,semi_furnished"
```

## Combined Filters Example

```bash
curl "http://localhost:3000/search/properties?\
q=sea+view&\
type=villa&\
community=Palm+Jumeirah&\
bedrooms=5,6&\
priceMin=20000000&\
priceMax=40000000&\
completionStatus=ready&\
amenities=pool,beach_access&\
page=1&\
limit=20"
```

## Geo-Spatial Search

### Search by Location (Radius)

**Endpoint:** `GET /search/properties/nearby`

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Radius in kilometers (default: 5)

**Example:**
```bash
curl "http://localhost:3000/search/properties/nearby?\
lat=25.1124&\
lng=55.1390&\
radius=3"
```

**Response includes distance:**
```json
{
  "results": [
    {
      "id": "property-uuid",
      "titleEn": "Villa in Palm Jumeirah",
      "location": {
        "lat": 25.1130,
        "lng": 55.1395
      },
      "distance": 0.8,
      "distanceUnit": "km"
    }
  ]
}
```

### Search within Polygon

**Endpoint:** `POST /search/properties/polygon`

**Request Body:**
```json
{
  "polygon": [
    { "lat": 25.10, "lng": 55.13 },
    { "lat": 25.12, "lng": 55.13 },
    { "lat": 25.12, "lng": 55.15 },
    { "lat": 25.10, "lng": 55.15 },
    { "lat": 25.10, "lng": 55.13 }
  ],
  "filters": {
    "type": "villa",
    "priceMax": 30000000
  }
}
```

## Autocomplete

### Property Search Autocomplete

**Endpoint:** `GET /search/autocomplete`

**Query Parameters:**
- `q`: Partial query text (min 2 characters)
- `type`: Autocomplete type (default: `all`)

**Types:**
- `all`: All suggestions
- `community`: Community names
- `property_type`: Property types
- `developer`: Developer names

**Example:**
```bash
curl "http://localhost:3000/search/autocomplete?q=palm&type=community"
```

**Response:**
```json
{
  "suggestions": [
    {
      "text": "Palm Jumeirah",
      "type": "community",
      "count": 245
    },
    {
      "text": "Palm Hills",
      "type": "community",
      "count": 87
    }
  ]
}
```

## Sorting

**Sort Options:**
- `price_asc`: Price low to high
- `price_desc`: Price high to low
- `area_asc`: Area small to large
- `area_desc`: Area large to small
- `date_desc`: Newest first (default)
- `date_asc`: Oldest first
- `relevance`: Best match (used with text search)

**Example:**
```bash
curl "http://localhost:3000/search/properties?q=villa&sort=price_desc"
```

## Faceted Search

Get aggregated counts for filter options:

**Endpoint:** `GET /search/facets`

**Response:**
```json
{
  "facets": {
    "propertyTypes": [
      { "value": "villa", "count": 1250 },
      { "value": "apartment", "count": 3500 },
      { "value": "penthouse", "count": 180 }
    ],
    "communities": [
      { "value": "Palm Jumeirah", "count": 245 },
      { "value": "Dubai Marina", "count": 890 },
      { "value": "Downtown Dubai", "count": 670 }
    ],
    "priceRanges": [
      { "min": 0, "max": 1000000, "count": 450 },
      { "min": 1000000, "max": 5000000, "count": 2100 },
      { "min": 5000000, "max": 10000000, "count": 800 }
    ],
    "bedrooms": [
      { "value": 1, "count": 650 },
      { "value": 2, "count": 1200 },
      { "value": 3, "count": 1800 },
      { "value": 4, "count": 950 },
      { "value": 5, "count": 320 }
    ]
  }
}
```

## Advanced Query Syntax

### Boolean Operators

```bash
# AND operator (default)
q=villa AND palm jumeirah

# OR operator
q=villa OR penthouse

# NOT operator
q=villa NOT downtown

# Grouping
q=(villa OR penthouse) AND (palm jumeirah OR marina)
```

### Phrase Search

```bash
q="sea view villa"
```

### Field-Specific Search

```bash
q=titleEn:villa community:palm
```

## Search Filters Object

For POST requests, use filters object:

**Endpoint:** `POST /search/properties`

**Request Body:**
```json
{
  "query": "luxury villa",
  "filters": {
    "type": ["villa", "penthouse"],
    "priceRange": {
      "min": 10000000,
      "max": 50000000
    },
    "bedrooms": [4, 5, 6],
    "communities": ["Palm Jumeirah", "Emirates Hills"],
    "amenities": ["pool", "beach_access", "gym"],
    "completionStatus": ["ready"],
    "purposeOptions": ["sale"]
  },
  "sort": "price_desc",
  "page": 1,
  "limit": 20
}
```

## Saved Searches

### Save Search Query

**Endpoint:** `POST /search/save`

```json
{
  "name": "Luxury Villas in Palm",
  "query": {
    "q": "villa",
    "type": "villa",
    "community": "Palm Jumeirah",
    "priceMin": 15000000,
    "bedrooms": "5,6"
  },
  "notifications": true,
  "notificationFrequency": "daily"
}
```

### Get Saved Searches

**Endpoint:** `GET /search/saved`

### Execute Saved Search

**Endpoint:** `GET /search/saved/{searchId}/execute`

## Performance Tips

1. **Use specific filters**: More filters = faster, more relevant results
2. **Limit results**: Don't request more than you need
3. **Use autocomplete**: Help users find what they want quickly
4. **Cache facets**: Facet data changes slowly, cache for 5-10 minutes
5. **Geo search**: Use radius search for nearby, polygon for custom areas

## Error Handling

**400 Bad Request - Invalid Parameters:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid price range: priceMin must be less than priceMax"
}
```

**413 Payload Too Large:**
```json
{
  "statusCode": 413,
  "error": "Payload Too Large",
  "message": "Polygon has too many points (max 100)"
}
```

## Rate Limits

- **Anonymous users:** 10 requests per minute
- **Authenticated users:** 100 requests per minute
- **Premium agents:** 1000 requests per minute

## Best Practices

1. Always add pagination to prevent large result sets
2. Use autocomplete to improve user experience
3. Combine text search with filters for best results
4. Use geo-search for location-based queries
5. Cache facet results to reduce load
6. Monitor search analytics to optimize relevance
