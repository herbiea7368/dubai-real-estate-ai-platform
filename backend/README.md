# Dubai Real Estate AI Platform - Backend

NestJS backend for the Dubai Real Estate AI Platform with PDPL-compliant data management.

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Language**: TypeScript
- **Authentication**: JWT (Passport)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local database)
- PostgreSQL 15 (if not using Docker)

## Getting Started

### 1. Environment Setup

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=real_estate_dev

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration (add when implementing auth)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Database

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

This will start a PostgreSQL 15 container on port 5432.

To verify the database is running:

```bash
docker-compose ps
```

To view database logs:

```bash
docker-compose logs -f postgres
```

To stop the database:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

### 4. Run Database Migrations

Execute migrations to create the database schema:

```bash
npm run migration:run
```

This will create:
- `users` table with PDPL-compliant user management
- `consents` table with immutable audit trail
- Indexes for performance optimization
- Foreign key relationships
- Immutability triggers for consent records

### 5. Seed Initial Data (Optional)

Populate the database with test users and sample consent records:

```bash
npm run seed:run
```

**Test Users Created:**
- `agent@test.com` - Real Estate Agent
- `marketing@test.com` - Marketing Team Member
- `compliance@test.com` - Compliance Officer
- `buyer@test.com` - Property Buyer (with consents)
- `buyer2@test.com` - Property Buyer (with consents)

**Note**: These are for development only. Passwords are not set (use passwordless auth for testing).

### 6. Verify Database Setup

Connect to the database to verify tables:

```bash
# Using Docker
docker exec -it dubai-real-estate-postgres psql -U postgres -d real_estate_dev

# Or using psql locally
psql -h localhost -p 5432 -U postgres -d real_estate_dev
```

**Useful PostgreSQL Commands:**

```sql
-- List all tables
\dt

-- Describe users table
\d users

-- Describe consents table
\d consents

-- View all users
SELECT id, email, name, roles FROM users;

-- View consent records
SELECT id, "personId", "consentType", granted, timestamp FROM consents;

-- Check foreign key constraints
\d consents

-- Exit psql
\q
```

## Development

### Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

Health check endpoint: `http://localhost:3000/health`

### Database Management

#### Migration Commands

```bash
# Generate a new migration (after entity changes)
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

#### Database Scripts

```bash
# Run complete database setup (check connection, create DB, run migrations)
bash scripts/db-setup.sh

# Seed database with test data
npm run seed:run
```

## Database Schema

### Users Table

Stores user accounts with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| phone | VARCHAR(20) | Unique phone number (nullable) |
| name | VARCHAR(255) | Full name |
| locale | ENUM | Language preference (en, ar) |
| roles | TEXT[] | User roles array |
| passwordHash | VARCHAR(255) | Hashed password (nullable) |
| isActive | BOOLEAN | Account status |
| emailVerified | BOOLEAN | Email verification status |
| phoneVerified | BOOLEAN | Phone verification status |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| lastLoginAt | TIMESTAMPTZ | Last login timestamp |

**Indexes:**
- Unique index on `email`
- Unique index on `phone`
- Index on `roles` for performance

### Consents Table (PDPL Compliant)

Immutable audit ledger for user consent tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| personId | UUID | Foreign key to users |
| consentType | ENUM | Type of consent (whatsapp, sms, email, phone) |
| granted | BOOLEAN | Consent granted or revoked |
| timestamp | TIMESTAMPTZ | Immutable timestamp of consent decision |
| ipAddress | VARCHAR(45) | IP address for audit |
| version | VARCHAR(50) | Terms version at time of consent |
| metadata | JSONB | Additional context (user agent, device, etc.) |
| termsUrl | TEXT | Reference to privacy policy/terms |
| expiresAt | TIMESTAMPTZ | Expiration date for time-limited consents |

**Indexes:**
- Composite index on `(personId, consentType)`
- Index on `timestamp` for audit queries

**PDPL Compliance Features:**
- **Immutable Records**: UPDATE operations are blocked by database trigger
- **Audit Trail**: Every consent change creates a new record
- **Timestamp Integrity**: Cannot be modified after creation
- **IP Tracking**: Records source of consent for verification
- **Version Control**: Tracks which terms version user agreed to

## Testing PDPL Compliance

### Test Consent Immutability

Try to update a consent record (should fail):

```sql
-- This should raise an exception
UPDATE consents SET granted = false WHERE id = 'some-consent-id';

-- Error: "Consent records are immutable and cannot be updated"
```

### Proper Consent Revocation

To revoke consent, create a new record:

```sql
-- Correct way to revoke consent
INSERT INTO consents ("personId", "consentType", granted, "ipAddress", version)
VALUES ('user-id', 'email', false, '192.168.1.1', '1.0');
```

## Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Run tests
npm run test

# Test coverage
npm run test:cov
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify environment variables in `.env`

4. Test connection manually:
   ```bash
   psql -h localhost -p 5432 -U postgres -d real_estate_dev
   ```

### Migration Errors

1. Check migration status:
   ```bash
   npm run migration:show
   ```

2. View pending migrations and fix any conflicts

3. If needed, revert last migration:
   ```bash
   npm run migration:revert
   ```

### Port Already in Use

If port 5432 is already in use:

1. Change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 on host
   ```

2. Update `.env`:
   ```env
   DATABASE_PORT=5433
   ```

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & user management
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   └── consent/        # PDPL consent management
│   │       └── entities/
│   │           └── consent.entity.ts
│   ├── migrations/         # TypeORM migrations
│   │   ├── 1733356800000-CreateUsersTable.ts
│   │   └── 1733356900000-CreateConsentTable.ts
│   ├── database/
│   │   └── seeds/          # Database seed scripts
│   │       └── initial-seed.ts
│   ├── data-source.ts      # TypeORM CLI configuration
│   ├── app.module.ts       # Root application module
│   └── main.ts             # Application entry point
├── scripts/
│   └── db-setup.sh         # Database setup automation
├── docker-compose.yml      # Local PostgreSQL container
├── .env                    # Environment variables (create this)
└── package.json
```

## Next Steps

1. **Authentication Module**: Implement JWT-based authentication
2. **Authorization Guards**: Role-based access control (RBAC)
3. **Consent API**: REST endpoints for consent management
4. **PDPL Compliance Middleware**: Automatic consent verification
5. **Audit Logging**: Track all data access and modifications

## License

Private - Dubai Real Estate AI Platform
