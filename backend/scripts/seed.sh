#!/bin/bash
set -e

echo "================================"
echo "Database Seeding Script"
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
  echo "❌ ERROR: Cannot run seed script in PRODUCTION environment"
  echo "Seeding is only allowed in development, test, or staging environments"
  exit 1
fi

echo "Running database seeds..."
echo ""

# Run seed command (you'll need to create this in package.json)
npm run seed:run

SEED_EXIT_CODE=$?

if [ $SEED_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Database seeding completed successfully"
  exit 0
else
  echo ""
  echo "❌ Database seeding failed with exit code $SEED_EXIT_CODE"
  exit $SEED_EXIT_CODE
fi
