# Dubai Real Estate AI Platform

An AI-powered bilingual (English/Arabic) real estate platform for the Dubai/UAE market, designed to streamline property transactions, lead management, and investor decision-making.

## Project Overview

This platform provides comprehensive real estate solutions including:

- **AI-Assisted Lead Management**: Intelligent lead scoring and automated nurturing workflows
- **Smart Listing Generation**: RERA/DLD Trakheesi permit-compliant property listings
- **Virtual Staging**: AI-powered property visualization and staging
- **Automated Valuation Models (AVM)**: Data-driven property valuations
- **Investor Tools**: ROI calculators and visa eligibility verification
- **Compliance**: PDPL-compliant data handling and TDRA messaging rules

## Technology Stack

### Cloud Infrastructure
- **Provider**: AWS (me-central-1 region)
- **Database**: Aurora PostgreSQL, DynamoDB
- **AI/ML**: Amazon SageMaker, MLflow
- **Vector Database**: Pinecone/Qdrant (TBD)

### Backend
- **Primary**: NestJS/Node.js (TypeScript)
- **ML Services**: FastAPI (Python)

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### Mobile
- **Framework**: React Native with Expo

## Project Structure

```
├── backend/           # NestJS backend services
├── frontend/          # Next.js web application
├── mobile/            # React Native mobile app
├── infrastructure/    # IaC and deployment configs
├── docs/              # Project documentation
├── scripts/           # Utility scripts
└── .github/           # GitHub Actions workflows
```

## Getting Started

Detailed setup instructions are available in [docs/setup-guide.md](docs/setup-guide.md)

## Documentation

- [Technology Stack Details](docs/tech-stack.md)
- [Setup Guide](docs/setup-guide.md)
- [Project Requirements (PRD)](docs/PRD.md) - _To be added_
- [Progress Log](docs/progress-log.md)

## Development Workflow

1. All development work happens on the `develop` branch
2. Feature branches should be created from `develop`
3. Pull requests must be reviewed before merging to `develop`
4. `main` branch contains production-ready code only

## License

[License TBD]

## Contact

[Contact information TBD]
