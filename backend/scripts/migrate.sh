#!/bin/bash
set -e

echo "================================"
echo "Database Migration Script"
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
  echo "You are about to run migrations on PRODUCTION database!"
  echo "Database: $DATABASE_NAME"
  echo "Host: $DATABASE_HOST"
  echo ""
  read -p "Are you absolutely sure you want to continue? (type 'yes' to proceed): " confirm

  if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 1
  fi

  echo ""
  echo "Creating database backup before migration..."

  # Create backup timestamp
  BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="backup_${DATABASE_NAME}_${BACKUP_TIMESTAMP}.sql"

  # Backup using pg_dump (requires PostgreSQL client tools)
  if command -v pg_dump &> /dev/null; then
    PGPASSWORD=$DATABASE_PASSWORD pg_dump \
      -h $DATABASE_HOST \
      -p ${DATABASE_PORT:-5432} \
      -U $DATABASE_USER \
      -d $DATABASE_NAME \
      -F c \
      -f "/tmp/$BACKUP_FILE"

    echo "✅ Backup created: /tmp/$BACKUP_FILE"
  else
    echo "⚠️  pg_dump not found. Skipping backup. Install PostgreSQL client tools for automatic backups."
    read -p "Continue without backup? (type 'yes' to proceed): " confirm_no_backup
    if [ "$confirm_no_backup" != "yes" ]; then
      echo "❌ Migration cancelled"
      exit 1
    fi
  fi

  echo ""
fi

# Show pending migrations
echo "Checking for pending migrations..."
echo ""

PENDING_MIGRATIONS=$(npm run migration:show 2>&1 || true)
echo "$PENDING_MIGRATIONS"
echo ""

# Run migrations
echo "Running database migrations..."
echo ""

npm run migration:run

MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Migrations completed successfully"
  echo ""

  # Show current migration status
  echo "Current migration status:"
  npm run migration:show || true

  exit 0
else
  echo ""
  echo "❌ Migration failed with exit code $MIGRATION_EXIT_CODE"

  if [ "$NODE_ENV" = "production" ] && [ -f "/tmp/$BACKUP_FILE" ]; then
    echo ""
    echo "To restore from backup, run:"
    echo "PGPASSWORD=\$DATABASE_PASSWORD pg_restore -h \$DATABASE_HOST -p \$DATABASE_PORT -U \$DATABASE_USER -d \$DATABASE_NAME -c /tmp/$BACKUP_FILE"
  fi

  exit $MIGRATION_EXIT_CODE
fi
