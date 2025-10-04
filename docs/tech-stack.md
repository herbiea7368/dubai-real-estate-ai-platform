# Technology Stack

## Cloud Infrastructure

### AWS (Middle East - me-central-1)
- **Compute**: ECS Fargate, Lambda
- **Database**:
  - Aurora PostgreSQL (relational data)
  - DynamoDB (NoSQL for high-throughput operations)
- **Storage**: S3 (images, documents, backups)
- **CDN**: CloudFront
- **Caching**: ElastiCache (Redis)
- **Message Queue**: SQS, SNS
- **AI/ML**: SageMaker, Bedrock
- **Search**: OpenSearch Service

## Backend Services

### Primary Backend - NestJS
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **API**: RESTful + GraphQL
- **Authentication**: JWT, OAuth 2.0
- **ORM**: TypeORM or Prisma
- **Validation**: class-validator, class-transformer

### ML Services - FastAPI
- **Framework**: FastAPI (Python 3.11+)
- **ML Libraries**:
  - scikit-learn
  - TensorFlow/PyTorch
  - Pandas, NumPy
- **Model Management**: MLflow
- **Vector Operations**: NumPy, FAISS

## Frontend

### Web Application - Next.js 14
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI / shadcn/ui
- **State Management**: Zustand / React Context
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl (English/Arabic support)

### Key Features
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- Internationalization (i18n)
- RTL support for Arabic

## Mobile Application

### React Native with Expo
- **Framework**: React Native
- **Platform**: Expo (managed workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Zustand
- **UI Components**: React Native Paper / NativeBase
- **i18n**: i18next

## Data & AI

### Databases
- **PostgreSQL (Aurora)**:
  - User accounts
  - Property listings
  - Transactions
  - Lead management

- **DynamoDB**:
  - Session data
  - Real-time messaging
  - Activity logs
  - Analytics events

### Vector Database (Decision Pending)
**Options under evaluation**:
- **Pinecone**: Managed, scalable, easy integration
- **Qdrant**: Self-hosted option, cost-effective for large datasets

**Use Cases**:
- Semantic property search
- Similar property recommendations
- Document embeddings for permit matching

### AI/ML Stack
- **Amazon SageMaker**: Model training and deployment
- **Amazon Bedrock**: Foundation models (Claude, Titan)
- **MLflow**: Experiment tracking and model versioning
- **OpenAI API**: GPT models for content generation
- **Anthropic Claude**: Complex reasoning and analysis

## DevOps & Infrastructure

### CI/CD
- **GitHub Actions**: Automated testing and deployment
- **Docker**: Containerization
- **AWS CodePipeline**: Production deployments

### Infrastructure as Code
- **Terraform**: Infrastructure provisioning
- **AWS CDK**: (Alternative option)

### Monitoring & Logging
- **CloudWatch**: Metrics and logs
- **DataDog**: (Optional) Advanced monitoring
- **Sentry**: Error tracking

### Security
- **AWS WAF**: Web application firewall
- **AWS Secrets Manager**: Secrets management
- **AWS KMS**: Encryption key management

## Compliance & Regulations

### Data Protection
- **PDPL Compliance**: UAE Personal Data Protection Law
- **Data Residency**: All data stored in UAE (me-central-1)

### Real Estate Regulations
- **RERA/DLD Integration**: Trakheesi permit verification
- **TDRA Compliance**: Messaging and communication rules

## Third-Party Integrations

### Real Estate Services
- **Bayut/Dubizzle API**: Property data sync
- **Property Finder API**: Market data
- **RERA/DLD APIs**: Permit verification

### Payment Processing
- **Network International**: UAE payment gateway
- **Stripe**: International payments (if applicable)

### Communication
- **Twilio**: SMS (TDRA compliant)
- **SendGrid**: Email marketing
- **WhatsApp Business API**: Customer communication

### Maps & Location
- **Google Maps API**: Property location
- **Mapbox**: (Alternative) Custom mapping

## Development Tools

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Jest**: Unit testing
- **Cypress**: E2E testing

### API Documentation
- **Swagger/OpenAPI**: REST API docs
- **GraphQL Playground**: GraphQL exploration

### Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **Conventional Commits**: Commit message standard

## Decision Log

| Technology | Status | Decision Date | Rationale |
|------------|--------|---------------|-----------|
| Vector DB (Pinecone vs Qdrant) | Pending | TBD | Evaluating cost vs features |
| ORM (TypeORM vs Prisma) | Pending | TBD | Need to assess migration tools |
| Monitoring (CloudWatch vs DataDog) | Pending | TBD | Budget and feature evaluation |

---

**Last Updated**: 2025-01-04
**Next Review**: After initial architecture validation
