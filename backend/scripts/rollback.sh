#!/bin/bash
set -e

echo "================================"
echo "Database Rollback Script"
echo "================================"
echo ""

# Check if NODE_ENV is set
if [ -z "$NODE_ENV" ]; then
  echo "⚠️  NODE_ENV is not set. Defaulting to 'development'"
  export NODE_ENV=development
fi

echo "Environment: $NODE_ENV"
echo ""

# Production safety check
if [ "$NODE_ENV" = "production" ]; then
  echo "⚠️  PRODUCTION ENVIRONMENT DETECTED ⚠️"
  echo ""
  echo "You are about to ROLLBACK the last migration on PRODUCTION database!"
  echo "Database: $DATABASE_NAME"
  echo "Host: $DATABASE_HOST"
  echo ""
  read -p "Are you absolutely sure you want to rollback? (type 'yes' to proceed): " confirm

  if [ "$confirm" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 1
  fi
fi

# Show current migration status
echo "Current migration status:"
echo ""
npm run migration:show || true
echo ""

# Confirm rollback
read -p "How many migrations do you want to rollback? (default: 1): " rollback_count
rollback_count=${rollback_count:-1}

echo ""
echo "Rolling back $rollback_count migration(s)..."
echo ""

# Rollback migrations
for ((i=1; i<=rollback_count; i++)); do
  echo "Rolling back migration $i of $rollback_count..."
  npm run migration:revert

  ROLLBACK_EXIT_CODE=$?

  if [ $ROLLBACK_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Rollback failed at migration $i"
    exit $ROLLBACK_EXIT_CODE
  fi
done

echo ""
echo "✅ Rollback completed successfully"
echo ""

# Show updated migration status
echo "Updated migration status:"
npm run migration:show || true

exit 0
