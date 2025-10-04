# Development Environment Setup Guide

## Prerequisites

### Required Tools

#### 1. Node.js and npm
- **Version**: Node.js 20.x LTS or higher
- **Download**: https://nodejs.org/
- **Verify installation**:
  ```bash
  node --version  # Should show v20.x.x
  npm --version   # Should show 10.x.x
  ```

#### 2. Python
- **Version**: Python 3.11 or higher
- **Download**: https://www.python.org/downloads/
- **Verify installation**:
  ```bash
  python --version  # Should show Python 3.11.x or higher
  pip --version
  ```

#### 3. Git
- **Version**: Latest stable
- **Download**: https://git-scm.com/
- **Verify installation**:
  ```bash
  git --version
  ```

#### 4. AWS CLI
- **Version**: AWS CLI v2
- **Download**: https://aws.amazon.com/cli/
- **Verify installation**:
  ```bash
  aws --version  # Should show aws-cli/2.x.x
  ```

#### 5. Docker Desktop
- **Version**: Latest stable
- **Download**: https://www.docker.com/products/docker-desktop
- **Verify installation**:
  ```bash
  docker --version
  docker-compose --version
  ```

#### 6. PostgreSQL (Optional - for local development)
- **Version**: PostgreSQL 15 or higher
- **Download**: https://www.postgresql.org/download/
- Or use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:15`

### Recommended Tools

- **VS Code** or **WebStorm/PyCharm**: IDE
- **Postman** or **Insomnia**: API testing
- **DBeaver** or **pgAdmin**: Database management
- **Expo Go** (mobile app): For React Native development

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/[YOUR-USERNAME]/dubai-real-estate-ai-platform.git
cd dubai-real-estate-ai-platform
```

### 2. Environment Configuration

Create environment files for each service:

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dubai_real_estate
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev_user
DATABASE_PASSWORD=dev_password
DATABASE_NAME=dubai_real_estate

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# AWS (Development)
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret

# Third-party APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# RERA/DLD (Test credentials)
RERA_API_KEY=
DLD_API_KEY=
```

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_STAGING=true
NEXT_PUBLIC_ENABLE_ROI_CALCULATOR=true
```

#### ML Service (.env)
```bash
cd ../ml-service
cp .env.example .env
```

Edit `ml-service/.env`:
```env
# FastAPI
ENVIRONMENT=development
API_PORT=8000

# Models
MODEL_PATH=./models
MLFLOW_TRACKING_URI=http://localhost:5000

# AWS
AWS_REGION=me-central-1

# Vector DB (Pinecone/Qdrant)
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
# OR
QDRANT_URL=http://localhost:6333
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

#### ML Service
```bash
cd ../ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Mobile
```bash
cd ../mobile
npm install
```

## Docker Setup (Recommended for Local Development)

### 1. Start Required Services

Create `docker-compose.dev.yml` in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: dubai_real_estate
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.9.2
    ports:
      - "5000:5000"
    command: mlflow server --host 0.0.0.0 --port 5000
    volumes:
      - mlflow_data:/mlflow

volumes:
  postgres_data:
  qdrant_data:
  mlflow_data:
```

Start services:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Running the Application

### 1. Database Migrations

```bash
cd backend
npm run migration:run
npm run seed:dev  # Optional: seed with development data
```

### 2. Start Backend

```bash
cd backend
npm run start:dev  # Runs with hot-reload
```

Backend will be available at: http://localhost:3000

### 3. Start ML Service

```bash
cd ml-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

ML Service will be available at: http://localhost:8000

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:3001

### 5. Start Mobile App (Optional)

```bash
cd mobile
npx expo start
```

Scan QR code with Expo Go app on your phone

## AWS Configuration

### 1. Configure AWS CLI

```bash
aws configure
```

Enter your development AWS credentials:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `me-central-1`
- Default output format: `json`

### 2. Test AWS Connection

```bash
aws s3 ls
aws dynamodb list-tables
```

## Testing Setup

### Backend Tests
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test           # Jest unit tests
npm run test:e2e       # Cypress E2E tests
```

### ML Service Tests
```bash
cd ml-service
pytest
pytest --cov=app tests/  # With coverage
```

## Troubleshooting

### Common Issues

#### Issue: PostgreSQL connection refused
**Solution**: Ensure PostgreSQL is running:
```bash
# If using Docker
docker-compose -f docker-compose.dev.yml ps

# If using local PostgreSQL
sudo service postgresql status  # Linux
brew services list              # macOS
```

#### Issue: Node modules not found
**Solution**: Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Python dependencies conflict
**Solution**: Use a fresh virtual environment:
```bash
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Issue: Port already in use
**Solution**: Find and kill the process:
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## VS Code Configuration

Recommended extensions:
- ESLint
- Prettier
- Python
- Docker
- REST Client
- GitLens

Recommended settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

## Next Steps

1. Review the [tech-stack.md](./tech-stack.md) for detailed technology information
2. Check the [PRD](./PRD.md) for feature requirements
3. Set up your IDE and extensions
4. Run the test suite to ensure everything works
5. Start with a simple feature to familiarize yourself with the codebase

## Support

For setup issues:
1. Check this guide first
2. Review the troubleshooting section
3. Check project issues on GitHub
4. Contact the team lead

---

**Last Updated**: 2025-01-04
