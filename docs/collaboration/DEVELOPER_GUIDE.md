# Developer Collaboration Guide

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker Desktop (recommended)
- Git

### Initial Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dubai-real-estate-ai-platform.git
   cd dubai-real-estate-ai-platform
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start services with Docker:**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations:**
   ```bash
   npm run migration:run
   ```

6. **Seed database:**
   ```bash
   npm run seed:run
   ```

7. **Start development server:**
   ```bash
   npm run start:dev
   ```

8. **Access API Documentation:**
   - Swagger UI: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/health

### Git Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. **Push to remote:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request on GitHub**

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch (current)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hotfix branches

### Code Standards

#### Before Committing
```bash
# Run linter
npm run lint

# Run tests
npm run test

# Build to verify no TypeScript errors
npm run build
```

#### Commit Message Format
```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat: Add property search by location

Implemented geospatial search using OpenSearch.
Added autocomplete for locations.

Closes #123
```

### Testing

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:cov
```

### Database Migrations

```bash
# Generate new migration
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Check service status
docker-compose ps
```

### Environment Variables

Key variables to configure in `.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=dubai_real_estate

# JWT
JWT_SECRET=your-secret-key-here

# OpenSearch (optional for local dev)
OPENSEARCH_NODE=http://localhost:9200

# AWS (optional)
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# AI Services (optional)
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### Project Structure

```
backend/
├── src/
│   ├── common/           # Shared utilities, decorators, interceptors
│   ├── config/           # Configuration files
│   ├── database/         # Database seeders
│   ├── docs/             # API documentation
│   ├── health/           # Health check endpoints
│   ├── migrations/       # TypeORM migrations
│   └── modules/          # Feature modules
│       ├── ai/           # AI-powered features
│       ├── analytics/    # Analytics and tracking
│       ├── auth/         # Authentication
│       ├── consent/      # PDPL consent management
│       ├── documents/    # Document processing
│       ├── leads/        # Lead management
│       ├── messaging/    # WhatsApp & SMS
│       ├── payments/     # Payment processing
│       ├── permits/      # Permit management
│       ├── properties/   # Property management
│       ├── reports/      # Reporting system
│       ├── search/       # Search functionality
│       └── valuations/   # Property valuations
├── test/                 # E2E tests
├── uploads/              # File uploads
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── package.json          # Dependencies
```

### API Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/docs-json

All endpoints are documented with:
- Request/response schemas
- Authentication requirements
- Example payloads
- Error responses

### Common Tasks

#### Adding a New Module

```bash
# Generate module
nest g module modules/my-module
nest g controller modules/my-module
nest g service modules/my-module

# Create DTOs
mkdir src/modules/my-module/dto
touch src/modules/my-module/dto/create-my-entity.dto.ts

# Create entities
mkdir src/modules/my-module/entities
touch src/modules/my-module/entities/my-entity.entity.ts
```

#### Creating a Migration

```bash
# After changing entities
npm run migration:generate -- src/migrations/AddMyNewField

# Review the generated migration
# Then run it
npm run migration:run
```

#### Debugging

```bash
# Start in debug mode
npm run start:debug

# Attach debugger on port 9229
```

VSCode launch.json:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229
}
```

### Troubleshooting

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### OpenSearch Issues
```bash
# Check OpenSearch health
curl http://localhost:9200/_cluster/health

# Restart OpenSearch
docker-compose restart opensearch
```

#### Build Errors
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Getting Help

- Check existing issues on GitHub
- Review API documentation at `/api/docs`
- Check progress log: `/docs/progress-log.md`
- Architecture docs: `/docs/architecture.md`

### Contributing Guidelines

1. **Code Quality**
   - Follow existing code style
   - Add JSDoc comments for public APIs
   - Write unit tests for business logic
   - Keep functions small and focused

2. **Pull Requests**
   - Create small, focused PRs
   - Include tests for new features
   - Update documentation as needed
   - Respond to review comments promptly

3. **Review Process**
   - All PRs require at least 1 approval
   - CI/CD must pass
   - No merge conflicts
   - Branch must be up to date with base

### Performance Tips

- Use database indices for frequently queried fields
- Implement caching for expensive operations
- Use pagination for large datasets
- Optimize N+1 queries with eager loading
- Monitor query performance with logging

### Security Guidelines

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Implement proper authentication/authorization
- Follow PDPL compliance requirements
- Use parameterized queries to prevent SQL injection

### Deployment

See `/docs/deployment/` for detailed deployment instructions:
- AWS deployment guide
- CI/CD pipeline configuration
- Environment setup
- Monitoring and logging
