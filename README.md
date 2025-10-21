# Blindx - SignatureRx Integration Platform

A full-stack prescription management system integrating with SignatureRx API, featuring OAuth 2.0 authentication, automated token refresh, webhook handling, and a modern React UI.

## 🎯 Overview

Blindx is a healthcare prescription management platform that enables:

- ✅ OAuth 2.0 Client Credentials authentication with SignatureRx API
- ✅ Automated access token refresh with Redis caching and background cron service
- ✅ Prescription issuance via SignatureRx API
- ✅ Webhook processing for prescription status updates
- ✅ PostgreSQL database with Kysely ORM for data persistence
- ✅ Type-safe API contracts with ts-rest
- ✅ Modern React frontend with Vite
- ✅ Comprehensive test coverage with Jest and Vitest
- ✅ Docker-based development environment

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Frontend │ ◄─────► │  Fastify Backend │ ◄─────► │  SignatureRx    │
│  (Vite + TS)    │         │  (ts-rest API)   │         │  API            │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐     ┌──────────┐    ┌──────────┐
              │PostgreSQL│     │  Redis   │    │  Cron    │
              │(Kysely)  │     │ (Tokens) │    │ Service  │
              └──────────┘     └──────────┘    └──────────┘
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Fastify 4.x (high-performance web framework)
- **API Contract**: ts-rest 3.x (type-safe API contracts shared between frontend and backend)
- **Database**: PostgreSQL 15 with Kysely (type-safe SQL query builder)
- **Cache**: Redis 7 (token storage with TTL)
- **Validation**: Zod 3.x (runtime type validation)
- **Testing**: Jest 29.x (unit and integration tests)
- **Logging**: Pino with pino-pretty

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 7.x
- **Language**: TypeScript 5.9
- **Testing**: Vitest with React Testing Library
- **API Client**: ts-rest client (auto-generated from shared contract)

### DevOps
- **Package Manager**: pnpm 10.x
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (quality checks, tests, build)

## 📁 Project Structure

```
blindx/
├── prescription/               # Backend API service
│   ├── src/
│   │   ├── __tests__/         # Integration tests
│   │   ├── data/              # Static data (medications)
│   │   ├── helpers/           # Utility functions and mocks
│   │   ├── libs/
│   │   │   ├── db/            # Database layer
│   │   │   │   ├── migrations/
│   │   │   │   ├── database.ts
│   │   │   │   └── migrate.ts
│   │   │   └── redis.ts       # Redis client
│   │   ├── services/
│   │   │   ├── prescription.service.ts
│   │   │   ├── signaturerx.service.ts
│   │   │   ├── webhook.service.ts
│   │   │   └── token-refresh-cron.service.ts
│   │   ├── types/             # TypeScript type definitions
│   │   ├── main.ts            # Server entry point
│   │   └── router.ts          # API route definitions
│   ├── tsconfig.json
│   └── package.json
├── frontend/                   # React UI
│   ├── src/
│   │   ├── __tests__/         # Component tests
│   │   ├── api/               # API client
│   │   ├── components/
│   │   │   ├── PrescriptionForm.tsx
│   │   │   └── PrescriptionList.tsx
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── shared/
│   └── contract.ts            # Shared API contract (ts-rest)
├── docs/
│   ├── README.md              # Detailed documentation
│   ├── QUICK_START.md         # Quick setup guide
│   └── TOKEN_REFRESH_CRON.md  # Token refresh service docs
├── docker-compose.yaml         # Local development services
├── docker-compose.prod.yaml    # Production deployment
├── api.dockerfile             # Backend Docker image
├── package.json               # Root package.json (workspaces)
├── pnpm-lock.yaml
└── tsconfig.json
```

## 🛠️ Prerequisites

- **Node.js**: 18 or higher
- **pnpm**: 10.0.0 (managed by packageManager field)
- **Docker**: For PostgreSQL and Redis
- **Docker Compose**: For orchestrating services

## 🚦 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SignatureRx API
SIGNATURERX_CLIENT_ID=your_client_id
SIGNATURERX_CLIENT_SECRET=your_client_secret
SIGNATURERX_BASE_URL=https://api.signaturerx.co.uk
SIGNATURERX_CLINIC_ID=842

# API Server
PORT=3001
NODE_ENV=development

# Token Refresh Cron
TOKEN_CHECK_INTERVAL_MINUTES=5
TOKEN_REFRESH_THRESHOLD_MINUTES=10

# Mock Mode (for testing without real API)
SIGNATURERX_MOCK=false
```

For frontend, create `.env` in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3001
VITE_SIGNATURERX_CLINIC_ID=842
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Start Development Servers

**Backend:**
```bash
pnpm api:dev
```

Backend runs on `http://localhost:3001`

**Frontend (in another terminal):**
```bash
pnpm ui:dev
```

Frontend runs on `http://localhost:5173`

### 6. Verify Setup

```bash
# Health check
curl http://localhost:3001/api/health

# List medications
curl http://localhost:3001/api/medications

# Open browser
open http://localhost:5173
```

## 📡 API Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-16T10:00:00.000Z"
}
```

### Medications

```http
GET /api/medications
```

**Response:**
```json
{
  "meds": [
    {
      "snomedId": "42089511000001103",
      "displayName": "Sildenafil 25mg tablets",
      "unlicensed": false,
      "endorsements": {},
      "prescribeByBrandOnly": false,
      "type": "vmp",
      "bnfExactMatch": "0704050R0AAABAB",
      "bnfMatches": null,
      "applianceTypes": []
    }
  ],
  "total": 10
}
```

### Prescriptions

#### Create Prescription

```http
POST /api/prescriptions/issue
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "issueForDelivery",
  "clinic_id": 842,
  "secure_pin": "111111",
  "notify": true,
  "send_sms": true,
  "invoice_clinic": false,
  "patient": {
    "first_name": "John",
    "last_name": "Doe",
    "gender": "male",
    "email": "john.doe@example.com",
    "phone": "441234567890",
    "birth_day": "15",
    "birth_month": "06",
    "birth_year": "1985",
    "address_ln1": "123 Test Street",
    "address_ln2": "",
    "city": "London",
    "post_code": "SW1A 1AA",
    "country": "United Kingdom"
  },
  "delivery_address": {
    "address_ln1": "123 Test Street",
    "address_ln2": "",
    "city": "London",
    "post_code": "SW1A 1AA",
    "country": "United Kingdom"
  },
  "medicines": [
    {
      "object": "medicine",
      "id": 0,
      "VPID": "42089511000001103",
      "description": "Sildenafil 25mg tablets",
      "qty": "10",
      "directions": "Take one tablet as needed"
    }
  ]
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pending",
  "prescription_id": "RX12345678",
  "created_at": "2025-01-16T10:00:00.000Z"
}
```

#### List Prescriptions

```http
GET /api/prescriptions
```

**Response:**
```json
{
  "prescriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "signaturerx_prescription_id": "RX12345678",
      "patient_email": "john.doe@example.com",
      "patient_name": "John Doe",
      "status": "Pending",
      "medicines": "[{\"object\":\"medicine\",\"VPID\":\"42089511000001103\"}]",
      "created_at": "2025-01-16T10:00:00.000Z",
      "updated_at": "2025-01-16T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### Get Prescription by ID

```http
GET /api/prescriptions/:id
```

### Webhooks

```http
POST /api/webhooks/signaturerx
Content-Type: application/json
```

**Request Body:**
```json
{
  "object": "event",
  "type": "prescription.status_changed",
  "data": {
    "prescription_token": "RX12345678",
    "status": "Delivered"
  }
}
```

**Response:**
```json
{
  "received": true,
  "message": "Webhook event processed successfully"
}
```

## 🔐 OAuth 2.0 Flow

### Token Management Strategy

1. **Initial Token Fetch**
   - On first API call or startup
   - POST to `/oauth/token` with client credentials
   - Receives access token with expiration time

2. **Token Storage**
   - Stored in Redis with TTL (auto-expiry)
   - Key: `signaturerx:token`
   - Contains: `{ access_token, expires_at }`

3. **Automatic Token Refresh**
   - Background cron service checks every 5 minutes
   - Proactively refreshes when < 10 minutes remaining
   - Uses refresh endpoint if available
   - Falls back to new token request

4. **Token Usage**
   - Automatically injected as `Authorization: Bearer <token>`
   - Used for all SignatureRx API calls

5. **Error Handling**
   - Retries on 401 Unauthorized
   - Refreshes token and retries once
   - Prevents infinite retry loops

### Token Refresh Cron Service

See [TOKEN_REFRESH_CRON.md](docs/TOKEN_REFRESH_CRON.md) for detailed documentation.

**Key Features:**
- Runs every 5 minutes (configurable)
- Refreshes tokens with < 10 minutes remaining
- Graceful shutdown handling
- Comprehensive logging

## 🗄️ Database Schema

### Prescriptions Table

```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signaturerx_prescription_id VARCHAR(255),
  patient_email VARCHAR(255) NOT NULL,
  patient_name VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  medicines JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_patient_email ON prescriptions(patient_email);
CREATE INDEX idx_prescriptions_signaturerx_id ON prescriptions(signaturerx_prescription_id);
```

### Webhook Events Table

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  prescription_id VARCHAR(255),
  status VARCHAR(50),
  payload JSONB NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_prescription_id ON webhook_events(prescription_id);
```

## 🧪 Testing

### Backend Tests (Jest)

```bash
# Run all tests
pnpm api:test

# Run with coverage
pnpm api:coverage

# Watch mode
pnpm api:watch-test
```

**Test Coverage:**
- OAuth token management
- Prescription CRUD operations
- Webhook processing
- Error handling scenarios
- Database interactions (mocked)

### Frontend Tests (Vitest)

```bash
# Run all tests
pnpm ui:test

# Run with coverage
pnpm ui:coverage

# Watch mode
pnpm ui:watch-test
```

**Test Coverage:**
- Component rendering
- User interactions
- Form validation
- API integration
- Error states

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## 📦 Available Scripts

```bash
# Backend
pnpm api:dev          # Start backend in watch mode
pnpm api:build        # Build backend for production
pnpm api:start        # Start production backend
pnpm api:test         # Run backend tests
pnpm api:coverage     # Run tests with coverage

# Frontend
pnpm ui:dev           # Start frontend dev server
pnpm ui:build         # Build frontend for production
pnpm ui:test          # Run frontend tests
pnpm ui:coverage      # Run tests with coverage

# Database
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate Kysely types from database

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Type check all TypeScript files
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yaml up -d
```

The production setup includes:
- Backend API built from `api.dockerfile`
- PostgreSQL database with persistent volume
- Redis cache with persistent volume
- Health checks for all services

## 🌟 Key Features

### 1. Type-Safe API Contract

Shared contract between frontend and backend ensures type safety across the entire stack:

```typescript
// shared/contract.ts
export const contract = c.router({
  prescriptions: {
    create: {
      method: "POST",
      path: "/api/prescriptions/issue",
      body: CreatePrescriptionRequestSchema,
      responses: {
        200: PrescriptionResponseSchema,
        400: z.object({ error: z.string() }),
      },
    },
  },
});
```

### 2. Automated Token Refresh

Background cron service prevents token expiration:
- Checks every 5 minutes
- Refreshes proactively before expiry
- Logs all activities
- Graceful shutdown

### 3. Comprehensive Error Handling

- Input validation with Zod
- API error mapping
- Retry logic for transient failures
- User-friendly error messages

### 4. Mock Mode for Testing

```env
SIGNATURERX_MOCK=true
```

Enables testing without real SignatureRx API credentials.

### 5. Modern React UI

- Responsive design
- Real-time prescription list updates
- Form validation
- Loading states
- Error and success notifications

## 🔒 Security Best Practices

### Implemented

- ✅ Environment variables for sensitive data
- ✅ No credentials in code or version control
- ✅ Token storage in Redis with TTL
- ✅ Input validation with Zod
- ✅ SQL injection protection (Kysely parameterization)
- ✅ CORS configuration
- ✅ TypeScript for type safety

### Production Recommendations

- 🔐 Enable HTTPS/TLS
- 🔐 Implement rate limiting
- 🔐 Add API key authentication for webhooks
- 🔐 Use secrets management (Vault, AWS Secrets Manager)
- 🔐 Enable audit logging
- 🔐 Implement RBAC (Role-Based Access Control)
- 🔐 Add request signing for webhooks
- 🔐 Use WAF (Web Application Firewall)

## 🐛 Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it <redis-container-id> redis-cli ping
```

### OAuth Token Errors

```bash
# Check environment variables
env | grep SIGNATURERX

# Enable mock mode for testing
echo "SIGNATURERX_MOCK=true" >> .env
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)
```

### Database Migration Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Wait for PostgreSQL to start
sleep 5

# Run migrations
pnpm db:migrate
```

## 📈 Performance Considerations

- **Token Caching**: Redis caching reduces OAuth token requests
- **Connection Pooling**: Kysely uses PostgreSQL connection pool (max: 10)
- **Async Operations**: All I/O operations are non-blocking
- **Fastify**: High-performance web framework (faster than Express)
- **Vite**: Fast frontend build tool with HMR

## 🔄 CI/CD Pipeline

GitHub Actions workflow includes:
- ✅ TypeScript type checking
- ✅ ESLint code quality checks
- ✅ Unit and integration tests
- ✅ Build verification
- ✅ Docker image build (production)

## 📚 Additional Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get running in 5 minutes
- [Token Refresh Cron](docs/TOKEN_REFRESH_CRON.md) - Background token refresh service
- [API Documentation](docs/README.md) - Detailed API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and confidential.

## 👥 Authors

- **Tung DNT** - Initial work and architecture

## 🙏 Acknowledgments

- SignatureRx API for prescription management capabilities
- ts-rest for type-safe API contracts
- Kysely for type-safe SQL queries
- Fastify community for excellent documentation

---

**Status**: ✅ Production Ready

**Version**: 1.0.0

**Last Updated**: January 2025