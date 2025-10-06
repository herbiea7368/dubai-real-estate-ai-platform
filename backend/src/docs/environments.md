# API Environments

## Overview

The Dubai Real Estate AI Platform is available in three environments: Development, Staging, and Production. Each environment has specific configurations, limitations, and use cases.

## Development Environment

### Base URL
```
http://localhost:3000
```

### Purpose
- Local development
- Feature testing
- Integration development
- Unit testing

### Characteristics
- **Database:** Local PostgreSQL
- **OpenSearch:** Local instance
- **Redis:** Local instance
- **File Storage:** Local filesystem
- **Payment Gateway:** Sandbox mode
- **WhatsApp API:** Test mode
- **AI Services:** Limited test credits

### Authentication
- Relaxed password requirements for testing
- Test users pre-created
- JWT expiration: 7 days
- No email verification required

### Rate Limits
- 10x higher than production
- Unlimited for local testing
- No IP restrictions

### Test Data
- Sample properties pre-loaded
- Test users available
- Mock payment data
- Dummy consent records

### Test Credentials
```json
{
  "buyer": {
    "email": "buyer@test.com",
    "phone": "+971501234570",
    "password": "TestPass123!"
  },
  "agent": {
    "email": "agent@test.com",
    "phone": "+971501234571",
    "password": "TestPass123!"
  },
  "developer": {
    "email": "developer@test.com",
    "phone": "+971501234572",
    "password": "TestPass123!"
  }
}
```

## Staging Environment

### Base URL
```
https://api-staging.yourdomain.com
```

### Purpose
- Pre-production testing
- Client demos
- UAT (User Acceptance Testing)
- Performance testing

### Characteristics
- **Database:** Cloud PostgreSQL (separate from production)
- **OpenSearch:** AWS OpenSearch Service
- **Redis:** AWS ElastiCache
- **File Storage:** AWS S3 (separate bucket)
- **Payment Gateway:** Sandbox mode
- **WhatsApp API:** Test Business Account
- **AI Services:** Separate API keys with limits

### Authentication
- Production-like password requirements
- Email verification enabled
- JWT expiration: 24 hours
- 2FA available for testing

### Rate Limits
- Same as production
- IP whitelisting available
- Can request temporary increases

### SSL/TLS
- Valid SSL certificate
- HTTPS enforced
- HSTS enabled

### Monitoring
- Application logs available
- Performance metrics tracked
- Error tracking enabled
- No user analytics

### Data Refresh
- Database refreshed weekly from anonymized production data
- Test data reset every Monday 00:00 UTC
- No permanent data storage

## Production Environment

### Base URL
```
https://api.yourdomain.com
```

### Purpose
- Live application
- Real user traffic
- Production transactions
- Business operations

### Characteristics
- **Database:** Highly available PostgreSQL cluster
- **OpenSearch:** Multi-node cluster with replication
- **Redis:** Multi-AZ cluster
- **File Storage:** S3 with CDN (CloudFront)
- **Payment Gateway:** Live mode with real transactions
- **WhatsApp API:** Business API with approved templates
- **AI Services:** Production API keys

### Authentication
- Strict password requirements
- Email verification required
- Phone verification required (for agents/developers)
- JWT expiration: 24 hours
- 2FA mandatory for sensitive operations

### Rate Limits
- Standard production limits
- Tiered based on user role
- Contact support for increases

### SSL/TLS
- TLS 1.3
- HTTPS enforced
- HSTS with preload
- Certificate pinning available

### Monitoring
- 24/7 uptime monitoring
- Real-time alerting
- Comprehensive logging
- User analytics
- Performance APM

### Backup and Recovery
- Database backups: Every 6 hours
- Point-in-time recovery: Up to 30 days
- File storage: Versioning enabled
- Disaster recovery: Multi-region

### Compliance
- PDPL compliance enforced
- TDRA regulations active
- Audit logs maintained
- Data retention policies

## Environment Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Availability** | Local only | 99% | 99.9% |
| **Data Persistence** | Temporary | Weekly reset | Permanent |
| **SSL** | Optional | Required | Required |
| **Email** | Console logs | Test emails | Real emails |
| **SMS/WhatsApp** | Mocked | Test mode | Live |
| **Payments** | Mocked | Sandbox | Live |
| **AI Credits** | Limited free | Test credits | Paid |
| **Support** | Self-service | Business hours | 24/7 |

## Switching Between Environments

### Using Environment Variables

Create `.env` files for each environment:

**.env.development:**
```env
NODE_ENV=development
API_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/dubai_real_estate_dev
REDIS_URL=redis://localhost:6379
AWS_S3_BUCKET=dev-uploads
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-test-...
```

**.env.staging:**
```env
NODE_ENV=staging
API_BASE_URL=https://api-staging.yourdomain.com
DATABASE_URL=postgresql://staging-db.aws.com:5432/dubai_real_estate
REDIS_URL=redis://staging-redis.aws.com:6379
AWS_S3_BUCKET=staging-uploads
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-prod-staging-...
```

**.env.production:**
```env
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://prod-db.aws.com:5432/dubai_real_estate
REDIS_URL=redis://prod-redis.aws.com:6379
AWS_S3_BUCKET=prod-uploads
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-prod-...
```

### Client Configuration

**JavaScript/TypeScript:**
```typescript
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },
  staging: {
    apiUrl: 'https://api-staging.yourdomain.com',
    wsUrl: 'wss://api-staging.yourdomain.com',
  },
  production: {
    apiUrl: 'https://api.yourdomain.com',
    wsUrl: 'wss://api.yourdomain.com',
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
```

## API Key Management

### Development
- No API key required for localhost
- Use test API keys for external services

### Staging
- Staging API keys issued per developer
- Keys rotate monthly
- Limited to staging domain

### Production
- Production API keys on request
- Strict validation and monitoring
- Keys tied to specific applications
- Rate limits enforced

### Obtaining API Keys

**For Partners/Integrators:**

1. **Sign up** at https://developers.yourdomain.com
2. **Verify identity** (business verification for production)
3. **Create application** (describe use case)
4. **Generate keys** (separate for staging/production)
5. **Implement** and test in staging
6. **Request production access** (after approval)

## Webhooks by Environment

### Development
```
http://localhost:3000/webhooks/...
```
- ngrok or similar tunnel required for external webhooks
- No signature verification required

### Staging
```
https://staging-app.yourdomain.com/webhooks/...
```
- Valid HTTPS endpoint required
- Signature verification optional
- Webhook logs available

### Production
```
https://app.yourdomain.com/webhooks/...
```
- Valid HTTPS endpoint required
- Signature verification mandatory
- Retry logic enforced
- Webhook logs retained for 90 days

## CORS Policies

### Development
```javascript
{
  origin: '*',
  credentials: true
}
```

### Staging
```javascript
{
  origin: [
    'https://staging-app.yourdomain.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}
```

### Production
```javascript
{
  origin: [
    'https://app.yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true
}
```

## Support and SLA

### Development
- **Support:** Community forums, documentation
- **SLA:** None
- **Updates:** Continuous

### Staging
- **Support:** Email support (business hours)
- **SLA:** Best effort
- **Updates:** Weekly deployments

### Production
- **Support:** 24/7 email, phone, chat
- **SLA:** 99.9% uptime guarantee
- **Updates:** Scheduled maintenance windows

## Migration Path

**Development → Staging:**
1. Code passes all tests
2. PR approved and merged
3. Automatic deployment to staging
4. Smoke tests run

**Staging → Production:**
1. UAT completed successfully
2. Performance benchmarks met
3. Security scan passed
4. Change management approval
5. Scheduled deployment window
6. Rollback plan ready
7. Post-deployment verification

## Best Practices

1. **Never use production credentials in development**
2. **Test in staging before production**
3. **Use environment-specific configurations**
4. **Monitor rate limits in all environments**
5. **Keep staging data up to date**
6. **Document environment-specific behaviors**
7. **Use feature flags for gradual rollouts**

## Troubleshooting

### Wrong Environment
Check current environment:
```bash
curl https://api.yourdomain.com/health
```

Response includes environment:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0"
}
```

### CORS Errors
Ensure your origin is whitelisted for the environment.

### SSL Issues
Staging and production require valid SSL. Development can use HTTP.

### Rate Limit Differences
Development has 10x limits. Test with production-equivalent limits in staging.

## Contact

For environment access or issues:
- **Development:** Self-service
- **Staging Access:** devops@yourdomain.com
- **Production Access:** partnerships@yourdomain.com
- **Support:** support@yourdomain.com
