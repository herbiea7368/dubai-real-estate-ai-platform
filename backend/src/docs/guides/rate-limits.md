# Rate Limits Guide

## Overview

The Dubai Real Estate AI Platform implements rate limiting to ensure fair usage, prevent abuse, and maintain system performance. Rate limits vary by endpoint category and user tier.

## Rate Limit Tiers

### Anonymous Users (No Authentication)

- **General API:** 10 requests per minute
- **Search:** 10 requests per minute
- **Public listings:** 20 requests per minute

### Authenticated Users (Buyers)

- **General API:** 60 requests per minute
- **Search:** 100 requests per minute
- **Messaging:** 10 messages per hour
- **AI Services:** 5 requests per hour

### Real Estate Agents

- **General API:** 300 requests per minute
- **Search:** 500 requests per minute
- **Messaging:** 100 messages per hour
- **AI Services:** 50 requests per hour
- **Bulk operations:** 10 batches per hour

### Developers

- **General API:** 600 requests per minute
- **Search:** 1000 requests per minute
- **Messaging:** 500 messages per hour
- **AI Services:** 200 requests per hour
- **Bulk operations:** 50 batches per hour

### Enterprise/API Partners

- **Custom limits** negotiated per contract
- **Dedicated resources** available
- **Priority queue** for AI services

## Rate Limit Headers

Every API response includes rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696598400
```

**Headers explained:**
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Endpoint-Specific Limits

### Authentication Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/register | 5 | per hour |
| POST /auth/login | 10 | per hour |
| POST /auth/refresh | 20 | per hour |

**Why strict limits?**
- Prevent brute force attacks
- Protect against credential stuffing
- Reduce spam registrations

### Search Endpoints

| User Tier | Requests/Min | Concurrent |
|-----------|--------------|------------|
| Anonymous | 10 | 2 |
| Authenticated | 100 | 5 |
| Agent | 500 | 10 |
| Developer | 1000 | 20 |

### AI Service Endpoints

| Service | Authenticated | Agent | Developer |
|---------|---------------|-------|-----------|
| Content Generation | 5/hour | 50/hour | 200/hour |
| Virtual Staging | 3/hour | 30/hour | 100/hour |
| Document AI | 10/hour | 100/hour | 500/hour |
| Valuations | 20/hour | 200/hour | 1000/hour |

### Messaging Endpoints

| Operation | Limit | Notes |
|-----------|-------|-------|
| Single message | 100/hour | Per user tier |
| Bulk messaging | 10 batches/hour | Max 1000 recipients/batch |
| Template create | 5/day | Requires approval |

### File Upload Endpoints

| Endpoint | Limit | Max Size |
|----------|-------|----------|
| Property images | 20/hour | 10MB per image |
| Documents | 50/hour | 25MB per document |
| Virtual staging | 10/hour | 15MB per image |

## Rate Limit Exceeded Response

When you exceed rate limits, you'll receive:

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45,
  "limit": 60,
  "remaining": 0,
  "resetAt": "2025-10-06T14:30:00.000Z"
}
```

**Response Headers:**
```
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1696598400
```

## Best Practices

### 1. Respect Rate Limit Headers

Always check rate limit headers and throttle requests accordingly:

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);

  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (remaining < 5) {
    const resetTime = new Date(reset * 1000);
    console.warn(`Approaching rate limit. Resets at ${resetTime}`);
  }

  return response;
}
```

### 2. Implement Exponential Backoff

When you receive 429, implement exponential backoff:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Use Bulk Endpoints

Instead of multiple single requests, use bulk endpoints:

**Bad:**
```javascript
// 100 separate requests
for (const lead of leads) {
  await sendMessage(lead);
}
```

**Good:**
```javascript
// 1 bulk request
await sendBulkMessages(leads);
```

### 4. Cache Results

Cache frequently accessed data to reduce API calls:

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key, fetchFn) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 5. Batch Similar Requests

Group similar requests to execute in parallel:

```javascript
// Instead of sequential requests
const [properties, leads, messages] = await Promise.all([
  fetch('/properties'),
  fetch('/leads'),
  fetch('/messages')
]);
```

## Handling Rate Limits by Language

### JavaScript/TypeScript

```typescript
class APIClient {
  private rateLimitRemaining: number = Infinity;
  private rateLimitReset: number = 0;

  async request(url: string, options: RequestInit) {
    // Wait if rate limit exceeded
    if (this.rateLimitRemaining === 0) {
      const waitTime = this.rateLimitReset - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const response = await fetch(url, options);

    // Update rate limit info
    this.rateLimitRemaining = parseInt(
      response.headers.get('X-RateLimit-Remaining') || 'Infinity'
    );
    this.rateLimitReset = parseInt(
      response.headers.get('X-RateLimit-Reset') || '0'
    ) * 1000;

    return response;
  }
}
```

### Python

```python
import time
import requests

class APIClient:
    def __init__(self):
        self.rate_limit_remaining = float('inf')
        self.rate_limit_reset = 0

    def request(self, url, **kwargs):
        # Wait if rate limit exceeded
        if self.rate_limit_remaining == 0:
            wait_time = self.rate_limit_reset - time.time()
            if wait_time > 0:
                time.sleep(wait_time)

        response = requests.request(url=url, **kwargs)

        # Update rate limit info
        self.rate_limit_remaining = int(
            response.headers.get('X-RateLimit-Remaining', float('inf'))
        )
        self.rate_limit_reset = int(
            response.headers.get('X-RateLimit-Reset', 0)
        )

        return response
```

## Monitoring and Alerts

### Set Up Monitoring

Track rate limit usage to prevent hitting limits:

```javascript
function logRateLimitUsage(response) {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const usagePercent = ((limit - remaining) / limit) * 100;

  if (usagePercent > 80) {
    console.warn(`High API usage: ${usagePercent.toFixed(1)}%`);
  }

  // Send to monitoring service
  analytics.track('api_rate_limit_usage', {
    endpoint: response.url,
    usage_percent: usagePercent,
    remaining: remaining
  });
}
```

## Requesting Limit Increases

If your use case requires higher limits:

1. **Document your use case**: Explain why you need higher limits
2. **Show current usage**: Provide metrics on current API usage
3. **Estimate future needs**: Project expected growth
4. **Contact support**: Email support@yourdomain.com with details

**Include:**
- Company/project name
- Current user tier
- Specific endpoints needing increase
- Business justification
- Expected request volume

## Special Considerations

### Webhooks

Webhooks are not rate limited but are subject to:
- **Retry policy:** 3 attempts with exponential backoff
- **Timeout:** 30 seconds per request
- **Payload size:** Max 1MB

### Background Jobs

Background jobs (reports, bulk exports) have separate limits:
- **Concurrent jobs:** 3 per user
- **Queue position:** Based on user tier
- **Timeout:** 10 minutes per job

### Development/Testing

Development environments have relaxed limits:
- **10x higher limits** for testing
- **Sandbox mode** available with unlimited requests
- **Test data** auto-generated for development

## FAQ

**Q: Do rate limits reset on a rolling window or fixed interval?**
A: Fixed intervals (per minute/hour/day). Reset time is in `X-RateLimit-Reset` header.

**Q: Are rate limits per user or per API key?**
A: Per authenticated user (JWT token). Anonymous requests are per IP address.

**Q: What happens to queued messages if I hit rate limit?**
A: Queued messages are not affected. Rate limits apply to API requests, not message delivery.

**Q: Can I check my rate limit without making a request?**
A: Yes, use `GET /rate-limit/status` endpoint (not counted against limits).

**Q: Are there separate limits for read vs write operations?**
A: Yes, write operations (POST/PUT/DELETE) have stricter limits than reads (GET).
