# Rollback Procedures

This document outlines the procedures for rolling back deployments in case of issues.

## Quick Rollback Checklist

- [ ] Identify the issue and confirm rollback is necessary
- [ ] Notify team of rollback decision
- [ ] Create incident report
- [ ] Execute rollback steps
- [ ] Verify rollback success
- [ ] Update incident report
- [ ] Schedule post-mortem

## Application Rollback

### ECS Service Rollback

Rollback to the previous task definition:

```bash
# 1. List recent task definitions
aws ecs list-task-definitions \
  --family-prefix dubai-real-estate-backend \
  --max-results 5 \
  --sort DESC

# 2. Update service to previous task definition
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --task-definition dubai-real-estate-backend:PREVIOUS_REVISION

# 3. Monitor deployment
aws ecs wait services-stable \
  --cluster dubai-real-estate-prod \
  --services backend-service

# 4. Verify health
curl https://api.yourdomain.com/health
```

### Docker Image Rollback

If you need to rollback to a specific image:

```bash
# 1. List recent images
aws ecr describe-images \
  --repository-name dubai-real-estate-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# 2. Create new task definition with previous image
aws ecs register-task-definition \
  --cli-input-json file://task-definition-rollback.json

# 3. Update service
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --task-definition dubai-real-estate-backend:NEW_REVISION
```

## Database Rollback

### Migration Rollback

Rollback the last migration:

```bash
# 1. Set environment
export NODE_ENV=production

# 2. Check current migrations
npm run migration:show

# 3. Rollback last migration
./backend/scripts/rollback.sh

# OR manually
npm run migration:revert
```

### Multiple Migrations Rollback

To rollback multiple migrations:

```bash
# Set number of migrations to rollback
export ROLLBACK_COUNT=3

# Run rollback script
./backend/scripts/rollback.sh

# Verify migrations status
npm run migration:show
```

### Full Database Restore

In case of critical database corruption:

```bash
# 1. List available backups
aws rds describe-db-snapshots \
  --db-instance-identifier dubai-real-estate-prod \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# 2. Stop application to prevent new writes
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --desired-count 0

# 3. Restore from snapshot (creates new instance)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dubai-real-estate-prod-restored \
  --db-snapshot-identifier snapshot-identifier

# 4. Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier dubai-real-estate-prod-restored

# 5. Update application configuration to point to restored DB
# Update task definition with new DB endpoint

# 6. Restart application
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --desired-count 2
```

### Point-in-Time Recovery

For RDS databases with PITR enabled:

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier dubai-real-estate-prod \
  --target-db-instance-identifier dubai-real-estate-prod-pitr \
  --restore-time 2025-01-15T10:30:00Z
```

## Configuration Rollback

### Environment Variables

If new environment variables cause issues:

```bash
# 1. Create new task definition with previous environment variables
aws ecs describe-task-definition \
  --task-definition dubai-real-estate-backend:PREVIOUS_REVISION \
  --query 'taskDefinition' > task-def-rollback.json

# 2. Remove unwanted fields and register
jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
  task-def-rollback.json > task-def-clean.json

aws ecs register-task-definition --cli-input-json file://task-def-clean.json

# 3. Update service
aws ecs update-service \
  --cluster dubai-real-estate-prod \
  --service backend-service \
  --task-definition dubai-real-estate-backend:NEW_REVISION
```

### Terraform Rollback

If infrastructure changes cause issues:

```bash
# 1. Check Terraform state
cd infrastructure/terraform
terraform state list

# 2. Revert to previous Terraform state
terraform state pull > backup-state.json

# 3. Apply previous configuration
git checkout PREVIOUS_COMMIT
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars

# 4. Or use targeted destroy for specific resources
terraform destroy -target=aws_resource.name
```

## Load Balancer Rollback

### Target Group Switching

If using Blue/Green deployment:

```bash
# Switch traffic back to previous target group
aws elbv2 modify-listener \
  --listener-arn LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=PREVIOUS_TARGET_GROUP_ARN
```

## Verification Steps

After any rollback, verify:

1. **Health Check**
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **API Endpoints**
   ```bash
   # Test critical endpoints
   curl https://api.yourdomain.com/api/properties
   curl https://api.yourdomain.com/api/auth/login -X POST
   ```

3. **Database Connectivity**
   ```bash
   psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;"
   ```

4. **Application Logs**
   ```bash
   aws logs tail /ecs/dubai-real-estate-production --follow
   ```

5. **Metrics Dashboard**
   - Check error rates
   - Monitor response times
   - Verify request success rates

## Communication Template

Use this template to communicate rollback:

```
Subject: [INCIDENT] Production Rollback - Dubai Real Estate Platform

Status: ROLLBACK IN PROGRESS / ROLLBACK COMPLETE

Issue:
- Description of the problem
- Impact on users
- Time issue was detected

Rollback Actions:
- [ ] Application rolled back to version X.Y.Z
- [ ] Database migrations reverted (if applicable)
- [ ] Configuration restored to previous state

Current Status:
- Service health: OK/DEGRADED
- User impact: NONE/MINIMAL/MODERATE

Next Steps:
- Root cause analysis scheduled for [DATE/TIME]
- Fix being developed in branch [BRANCH_NAME]
- Expected resolution: [TIMEFRAME]

Updates will be provided every 30 minutes.
```

## Post-Rollback Actions

1. **Create Incident Report**
   - Document what went wrong
   - Timeline of events
   - Actions taken
   - Resolution

2. **Schedule Post-Mortem**
   - Review what happened
   - Identify root cause
   - Discuss prevention measures
   - Update runbooks

3. **Update Monitoring**
   - Add alerts for similar issues
   - Improve health checks
   - Update dashboards

4. **Plan Fix**
   - Develop fix in feature branch
   - Add tests to prevent regression
   - Deploy to staging first
   - Gradual rollout to production

## Emergency Contacts

- **On-Call Engineer**: +971-XXX-XXXXX
- **DevOps Lead**: +971-XXX-XXXXX
- **CTO**: +971-XXX-XXXXX
- **AWS Support**: 1-800-XXX-XXXX (Case Priority: High)

## Rollback Prevention

To minimize the need for rollbacks:

1. **Comprehensive Testing**
   - Unit tests
   - Integration tests
   - E2E tests
   - Load tests

2. **Staging Environment**
   - Deploy to staging first
   - Soak test for 24 hours
   - Verify all integrations

3. **Gradual Rollout**
   - Use canary deployments
   - Monitor metrics closely
   - Rollback automatically on errors

4. **Feature Flags**
   - Deploy code disabled
   - Enable gradually
   - Instant disable capability

5. **Database Changes**
   - Backward compatible migrations
   - Test rollback procedures
   - Separate deployment from data migration
