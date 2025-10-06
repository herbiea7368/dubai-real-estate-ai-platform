#!/bin/bash

# Test Search Endpoints for Dubai Real Estate AI Platform
# Run after starting the application with: npm run start:dev

BASE_URL="http://localhost:3000"

echo "==================================="
echo "Dubai Real Estate Search API Tests"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Basic English search
echo -e "${BLUE}Test 1: Basic English Search - 'villa'${NC}"
curl -s "$BASE_URL/search/properties?q=villa&limit=3" | python -m json.tool
echo ""
echo ""

# Test 2: Arabic search
echo -e "${BLUE}Test 2: Arabic Search - 'فيلا'${NC}"
curl -s "$BASE_URL/search/properties?q=فيلا&limit=3" | python -m json.tool
echo ""
echo ""

# Test 3: Search with filters
echo -e "${BLUE}Test 3: Filtered Search - Villa, 3+ beds, 1M-5M AED${NC}"
curl -s "$BASE_URL/search/properties?q=villa&beds=3&minPrice=1000000&maxPrice=5000000&limit=3" | python -m json.tool
echo ""
echo ""

# Test 4: Autocomplete
echo -e "${BLUE}Test 4: Autocomplete - 'dow'${NC}"
curl -s "$BASE_URL/search/autocomplete?q=dow" | python -m json.tool
echo ""
echo ""

# Test 5: Geo radius search (near Burj Khalifa)
echo -e "${BLUE}Test 5: Geo Radius Search - Near Burj Khalifa (5km)${NC}"
curl -s "$BASE_URL/search/geo/radius?lat=25.1972&lng=55.2744&radius=5" | python -m json.tool
echo ""
echo ""

# Test 6: Search near landmark
echo -e "${BLUE}Test 6: Search Near Landmark - 'burj khalifa'${NC}"
curl -s "$BASE_URL/search/geo/landmark/burj%20khalifa" | python -m json.tool
echo ""
echo ""

# Test 7: Sort by price
echo -e "${BLUE}Test 7: Search Sorted by Price (Descending)${NC}"
curl -s "$BASE_URL/search/properties?q=apartment&sort=price_desc&limit=3" | python -m json.tool
echo ""
echo ""

# Test 8: Search with facets
echo -e "${BLUE}Test 8: Search with Facets - Community aggregations${NC}"
curl -s "$BASE_URL/search/properties?q=&limit=5" | python -m json.tool | grep -A 20 "aggregations"
echo ""
echo ""

# Test 9: OpenSearch health check
echo -e "${BLUE}Test 9: OpenSearch Health Check${NC}"
curl -s "http://localhost:9200/_cluster/health?pretty"
echo ""
echo ""

# Test 10: Check indices
echo -e "${BLUE}Test 10: OpenSearch Indices${NC}"
curl -s "http://localhost:9200/_cat/indices?v"
echo ""
echo ""

echo -e "${GREEN}==================================="
echo "All tests completed!"
echo "===================================${NC}"
