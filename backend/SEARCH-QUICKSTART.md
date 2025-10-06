# OpenSearch Integration - Quick Start Guide

## Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- PostgreSQL (via Docker Compose)

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start Docker Services
```bash
# Start PostgreSQL and OpenSearch
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps
```

### 3. Verify OpenSearch is Running
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Expected output: "status": "green" or "yellow"
```

### 4. Run Database Migrations
```bash
npm run migration:run
```

### 5. Seed Database (with OpenSearch Indexing)
```bash
npm run seed:run

# Look for output:
# 🔍 Indexing properties and listings in OpenSearch...
# ✓ OpenSearch indices created
# ✓ Indexed 5 properties
# ✓ Indexed 5 listings
```

### 6. Start the Application
```bash
npm run start:dev

# Wait for: "Application is running on: http://localhost:3000"
```

## Test the Search API

### Option 1: Use the Test Script
```bash
bash scripts/test-search.sh
```

### Option 2: Manual Testing

#### Test 1: Basic English Search
```bash
curl "http://localhost:3000/search/properties?q=villa&limit=3" | python -m json.tool
```

#### Test 2: Arabic Search
```bash
curl "http://localhost:3000/search/properties?q=فيلا&limit=3" | python -m json.tool
```

#### Test 3: Filtered Search (Villa, 3 beds, 1M-5M AED)
```bash
curl "http://localhost:3000/search/properties?q=villa&beds=3&minPrice=1000000&maxPrice=5000000" | python -m json.tool
```

#### Test 4: Autocomplete
```bash
curl "http://localhost:3000/search/autocomplete?q=dow" | python -m json.tool
```

#### Test 5: Geo Radius Search (Near Burj Khalifa)
```bash
curl "http://localhost:3000/search/geo/radius?lat=25.1972&lng=55.2744&radius=5" | python -m json.tool
```

#### Test 6: Search Near Landmark
```bash
curl "http://localhost:3000/search/geo/landmark/burj%20khalifa" | python -m json.tool
```

#### Test 7: Sort by Price
```bash
curl "http://localhost:3000/search/properties?q=apartment&sort=price_desc&limit=3" | python -m json.tool
```

#### Test 8: Search with Facets
```bash
curl "http://localhost:3000/search/properties?q=&limit=5" | python -m json.tool
# Look for "aggregations" in response
```

## Verify OpenSearch Indices

### Check Indices
```bash
curl "http://localhost:9200/_cat/indices?v"

# Expected output:
# health status index      pri rep docs.count
# green  open   properties   2   1          5
# green  open   listings     2   1          5
```

### View Index Mappings
```bash
# Properties index
curl "http://localhost:9200/properties/_mapping?pretty"

# Listings index
curl "http://localhost:9200/listings/_mapping?pretty"
```

### Sample Search Query (Direct to OpenSearch)
```bash
curl -X POST "http://localhost:9200/properties/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "multi_match": {
      "query": "villa",
      "fields": ["community^3", "developer^2", "description"]
    }
  },
  "size": 3
}
'
```

## API Endpoints Reference

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/properties` | Main search with facets |
| GET | `/search/autocomplete?q={query}` | Autocomplete suggestions |
| GET | `/search/similar/:propertyId` | Similar properties |
| GET | `/search/geo/radius` | Geo radius search |
| GET | `/search/geo/bounds` | Geo bounds search |
| GET | `/search/geo/cluster` | Map clustering |
| GET | `/search/geo/landmark/:name` | Landmark search |

### Protected Endpoints (Requires Authentication)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/search/index/property/:id` | Index single property | Agent/Marketing/Compliance |
| POST | `/search/reindex` | Full reindex | Compliance |

### Analytics Endpoints (Requires Authentication)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/search/analytics/popular` | Popular searches | Marketing/Compliance |
| GET | `/search/analytics/zero-results` | Zero-result queries | Marketing/Compliance |
| GET | `/search/analytics/metrics` | Search metrics | Marketing/Compliance |
| GET | `/search/analytics/conversion-rate` | Conversion rate | Marketing/Compliance |

## Search Parameters

### Main Search (`/search/properties`)
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| q | string | Search query | `villa`, `فيلا` |
| type | enum | Property type | `APARTMENT`, `VILLA` |
| minPrice | number | Minimum price (AED) | `1000000` |
| maxPrice | number | Maximum price (AED) | `5000000` |
| beds | integer | Bedrooms | `3` |
| baths | number | Bathrooms | `2.5` |
| community | string | Community name | `Dubai Marina` |
| purpose | enum | Sale or rent | `sale`, `rent` |
| page | integer | Page number (min 1) | `1` |
| limit | integer | Results per page (1-100) | `20` |
| sort | enum | Sort order | `price_asc`, `price_desc`, `date_desc`, `relevance` |

### Geo Search (`/search/geo/radius`)
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| lat | number | Latitude (-90 to 90) | `25.1972` |
| lng | number | Longitude (-180 to 180) | `55.2744` |
| radius | number | Radius in km (0.1-50) | `5` |

## Troubleshooting

### OpenSearch not starting
```bash
# Check logs
docker logs dubai-real-estate-opensearch

# Common issue: Port already in use
netstat -ano | findstr :9200

# Solution: Stop conflicting service or change port in docker-compose.yml
```

### Index creation fails
```bash
# Delete existing indices
curl -X DELETE "http://localhost:9200/properties"
curl -X DELETE "http://localhost:9200/listings"

# Re-run seed
npm run seed:run
```

### Search returns no results
```bash
# Check document count
curl "http://localhost:9200/properties/_count?pretty"

# If count is 0, reindex:
npm run seed:run
```

### Application won't start
```bash
# Check TypeScript errors
npm run build

# Check environment variables
cat .env | grep OPENSEARCH
```

## Clean Up

### Stop Services
```bash
docker-compose down
```

### Remove Volumes (Complete Reset)
```bash
docker-compose down -v
```

### Remove OpenSearch Data Only
```bash
docker volume rm backend_opensearch_data
```

## Next Steps

1. **Review Implementation**:
   - Read `TASK-15-SUMMARY.md` for comprehensive documentation
   - Check `TASK-15-VERIFICATION.md` for all completion criteria

2. **Production Deployment**:
   - Set up AWS OpenSearch Service
   - Configure VPC and security groups
   - Enable authentication and TLS
   - See production notes in `TASK-15-SUMMARY.md`

3. **Enhancements**:
   - Implement semantic search with embeddings
   - Add ML-based suggestions
   - Configure synonym mappings
   - Implement spell checking

## Support

For issues or questions:
1. Check `TASK-15-SUMMARY.md` for detailed implementation notes
2. Review `TASK-15-VERIFICATION.md` for expected outputs
3. See `TASK-15-FILES-CREATED.md` for file structure

---

**Happy Searching! 🔍**
