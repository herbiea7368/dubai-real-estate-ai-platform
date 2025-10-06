# Dubai Real Estate AI Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the Dubai Real Estate AI Platform to production, staging, and development environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts and Services

- **AWS Account** with appropriate permissions for:
  - ECS (Elastic Container Service)
  - RDS (PostgreSQL)
  - OpenSearch
  - S3
  - ECR (Elastic Container Registry)
  - VPC, IAM, CloudWatch

- **Domain and SSL Certificates**:
  - Domain configured in Route 53 or other DNS provider
  - SSL/TLS certificates in AWS Certificate Manager

- **External Services**:
  - Anthropic API key (Claude AI)
  - WhatsApp Business API credentials
  - Twilio account (SMS)
  - Payment gateway credentials (Telr, Stripe, etc.)
  - Google Maps API key

### Required Tools

```bash
# Install required tools
- Node.js 18 or higher
- Docker and Docker Compose
- AWS CLI
- Terraform (for infrastructure)
- Git
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/dubai-real-estate-ai-platform.git
cd dubai-real-estate-ai-platform
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your specific configuration. See [Environment Variables Guide](./environment-variables.md) for detailed explanations.

### 3. Database Initialization

```bash
# Run migrations
npm run migration:run

# Seed database (development only)
npm run seed:run
```

## Local Development

### Using Docker Compose

The easiest way to run the application locally is using Docker Compose:

```bash
cd backend

# Start all services (PostgreSQL, OpenSearch, Application)
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

The application will be available at:
- API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

### Running Locally Without Docker

```bash
# Install dependencies
npm install

# Start PostgreSQL and OpenSearch (use Docker Compose for these)
docker-compose up postgres opensearch

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Linting
npm run lint
```

## Staging Deployment

### 1. Infrastructure Setup (First-time only)

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with staging configuration

# Plan infrastructure changes
terraform plan -var-file=terraform.tfvars

# Apply infrastructure
terraform apply -var-file=terraform.tfvars
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
STAGING_SUBNET_IDS
STAGING_SECURITY_GROUP
STAGING_API_URL
```

### 3. Deploy to Staging

Deployment to staging happens automatically when code is pushed to the `develop` branch:

```bash
git checkout develop
git add .
git commit -m "Your commit message"
git push origin develop
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Push to ECR
4. Deploy to ECS
5. Run database migrations
6. Verify deployment

### 4. Manual Staging Deployment

If needed, you can deploy manually:

```bash
# Build Docker image
docker build -t dubai-real-estate-backend:staging -f backend/Dockerfile backend/

# Tag and push to ECR
aws ecr get-login-password --region me-central-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.me-central-1.amazonaws.com
docker tag dubai-real-estate-backend:staging ACCOUNT_ID.dkr.ecr.me-central-1.amazonaws.com/dubai-real-estate-backend:staging
docker push ACCOUNT_ID.dkr.ecr.me-central-1.amazonaws.com/dubai-real-estate-backend:staging

# Update ECS service
aws ecs update-service --cluster dubai-real-estate-staging --service backend-service --force-new-deployment

# Run migrations (if needed)
./backend/scripts/migrate.sh
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] SSL certificates valid
- [ ] External services configured and tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment window

### 1. Create Database Backup

```bash
# Automated backup (included in migration script)
export NODE_ENV=production
./backend/scripts/migrate.sh

# Manual backup
PGPASSWORD=$DATABASE_PASSWORD pg_dump \
  -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  -F c \
  -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Deploy to Production

Deployment to production happens automatically when code is merged to `main` branch:

```bash
git checkout main
git merge develop
git push origin main
```

### 3. Post-Deployment Verification

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# Check specific endpoints
curl https://api.yourdomain.com/api/docs

# Verify database migrations
npm run migration:show

# Monitor logs
aws logs tail /ecs/dubai-real-estate-production --follow
```

### 4. Rollback Procedure

If deployment fails, follow these steps:

```bash
# 1. Rollback ECS service to previous task definition
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --task-definition dubai-real-estate-backend:PREVIOUS_VERSION

# 2. Rollback database migration (if needed)
export NODE_ENV=production
./backend/scripts/rollback.sh

# 3. Restore from backup (if critical)
PGPASSWORD=$DATABASE_PASSWORD pg_restore \
  -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  -c backup_file.sql

# 4. Verify rollback
curl https://api.yourdomain.com/health
```

See [Rollback Guide](./rollback.md) for detailed procedures.

## Monitoring

### CloudWatch Dashboards

Access CloudWatch dashboards at:
- https://console.aws.amazon.com/cloudwatch/

Key metrics to monitor:
- ECS CPU and Memory utilization
- RDS connections and query performance
- Application error rates
- Request latency (P50, P95, P99)
- Health check status

### Application Logs

```bash
# View real-time logs
aws logs tail /ecs/dubai-real-estate-production --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/dubai-real-estate-production \
  --filter-pattern "ERROR"

# Export logs
aws logs create-export-task \
  --log-group-name /ecs/dubai-real-estate-production \
  --from 1609459200000 \
  --to 1609545600000 \
  --destination logs-export-bucket
```

### Alerts

Configure CloudWatch Alarms for:
- High error rate (> 5% in 5 minutes)
- High response time (> 2s P95)
- Low health check success rate (< 90%)
- High CPU/Memory usage (> 80%)
- Database connection failures

### Performance Monitoring

If using Datadog or New Relic, access dashboards at:
- Datadog: https://app.datadoghq.com
- New Relic: https://one.newrelic.com

## Troubleshooting

### Common Issues

#### Application Not Starting

```bash
# Check ECS task logs
aws logs tail /ecs/dubai-real-estate-production --follow

# Check task definition
aws ecs describe-task-definition --task-definition dubai-real-estate-backend

# Check service events
aws ecs describe-services \
  --cluster dubai-real-estate-prod \
  --services backend-service
```

#### Database Connection Issues

```bash
# Test database connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check RDS status
aws rds describe-db-instances --db-instance-identifier dubai-real-estate-prod
```

#### High Response Times

1. Check CloudWatch metrics for CPU/Memory
2. Review slow query logs in RDS
3. Check OpenSearch cluster health
4. Review application logs for errors
5. Consider scaling ECS tasks

#### Migration Failures

```bash
# Check migration status
npm run migration:show

# View migration logs
cat logs/combined.log | grep migration

# Manually run specific migration
npm run migration:run -- --specific MigrationName
```

### Support Contacts

- **DevOps Lead**: devops@yourdomain.com
- **Platform Team**: platform@yourdomain.com
- **On-call**: +971-XXX-XXXXX

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate credentials** regularly (every 90 days)
3. **Use IAM roles** instead of access keys where possible
4. **Enable MFA** for all AWS accounts
5. **Review security groups** regularly
6. **Keep dependencies updated** with `npm audit`
7. **Monitor for security vulnerabilities** with Snyk or similar
8. **Enable CloudTrail** for audit logging
9. **Use encrypted connections** for all data in transit
10. **Follow principle of least privilege** for all IAM policies

## Additional Resources

- [Environment Variables Guide](./environment-variables.md)
- [Rollback Procedures](./rollback.md)
- [Infrastructure as Code Guide](./terraform.md)
- [CI/CD Pipeline Documentation](./cicd.md)
- [API Documentation](http://localhost:3000/api/docs)
- [Architecture Overview](../architecture.md)
