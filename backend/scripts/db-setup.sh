#!/bin/bash

# Database Setup Script for Dubai Real Estate AI Platform
# This script checks PostgreSQL status, creates the database if needed, and runs migrations

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Default values
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USER:-postgres}
DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
DB_NAME=${DATABASE_NAME:-real_estate_dev}

echo "🔍 Checking PostgreSQL connection..."

# Check if PostgreSQL is accessible
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw template1; then
    echo "❌ Error: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
    echo "Please ensure PostgreSQL is running (try: docker-compose up -d)"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    echo "✅ Database '$DB_NAME' created successfully"
fi

# Run migrations
echo "🔄 Running database migrations..."
npm run migration:run

echo "✅ Database setup completed successfully!"
echo ""
echo "To seed initial data, run: npm run seed:run"
