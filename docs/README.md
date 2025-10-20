# Blinx SignatureRx OAuth Integration

A comprehensive OAuth 2.0 Client Credentials integration prototype between the Blinx PACO platform and SignatureRx API, demonstrating secure authentication, token management, and prescription issuance capabilities.

## 🎯 Project Overview

This project implements a full-stack healthcare prescription management system that:

- ✅ Authenticates with SignatureRx using OAuth 2.0 Client Credentials Flow
- ✅ Manages access and refresh tokens with automatic expiry handling
- ✅ Issues prescriptions via the SignatureRx API
- ✅ Receives and processes webhook events for prescription status updates
- ✅ Stores completed prescriptions in PostgreSQL database
- ✅ Provides a modern React UI for medication selection and prescription creation

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │ ◄─────► │  Fastify Backend │ ◄─────► │  SignatureRx    │
│  (Vite)         │         │  (ts-rest)       │         │  API            │
│                 │         │                  │         │                 │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   (Kysely)      │
                            └─────────────────┘
```

## 🚀 Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **API Contract**: ts-rest (type-safe API contracts)
- **Database**: PostgreSQL with Kysely (type-safe SQL query builder)
- **Logging**: Pino (high-performance JSON logger)
- **Testing**: Vitest (fast unit test framework)
- **Validation**: Zod (TypeScript-first schema validation)

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: CSS3 (with modern gradients and animations)

### Infrastructure

- **Database**: Docker-based PostgreSQL 16
- **Environment**: dotenv for configuration management

## 📁 Project Structure

```
blinx-signaturerx-integration/
├── prescription/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                 # Environment configuration
│   │   ├── db/
│   │   │   ├── database.ts            # Kysely database instance
│   │   │   ├── types.ts               # Database type definitions
│   │   │   ├── migrate.ts             # Migration runner
│   │   │   └── migrations/
│   │   │       └── 001_create_prescriptions.ts
│   │   ├── routes/
│   │   │   ├── prescription.routes.ts # Prescription endpoints
│   │   │   └── webhook.routes.ts      # Webhook endpoints
│   │   ├── services/
│   │   │   ├── oauth.service.ts       # OAuth token management
│   │   │   ├── prescription.service.ts # Prescription issuance
│   │   │   └── webhook.service.ts     # Webhook processing
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript types
│   │   ├── utils/
│   │   │   └── logger.ts              # Logging utility
│   │   └── index.ts                   # Server entry point
│   ├── tests/
│   │   ├── oauth.service.test.ts
│   │   ├── prescription.service.test.ts
│   │   └── webhook.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MedicationSelector.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   └── PrescriptionStatus.tsx
│   │   ├── data/
│   │   │   └── medications.ts         # Medication data
│   │   ├── services/
│   │   │   └── api.ts                 # API client
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/tung-dnt/PreSEO.git
cd PreSEO
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your SignatureRx credentials:

```env
SIGNATURERX_CLIENT_ID=your_actual_client_id
SIGNATURERX_CLIENT_SECRET=your_actual_client_secret
```

### 3. Start Database

```bash
docker-compose up -d
```

Wait for PostgreSQL to be ready (check with `docker-compose logs postgres`).

### 4. Backend Setup

```bash
cd backend
npm install
npm run migrate:latest  # Run database migrations
npm run dev             # Start development server
```

Backend will be running on `http://localhost:3000`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be running on `http://localhost:5173`

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm run test:ui       # Run tests with UI
```

Tests cover:

- OAuth token retrieval and refresh
- Prescription API integration
- Webhook event processing
- Error handling and retries

## 📡 API Endpoints

### Prescriptions

#### POST `/prescriptions/issue`

Issue a new prescription for delivery.

**Request Body:**

```json
{
  "action": "issueForDelivery",
  "clinic_id": 842,
  "patient": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    ...
  },
  "medicines": [
    {
      "VPID": "39732011000001102",
      "description": "Amlodipine 5mg tablets",
      "qty": "10",
      "directions": "Take as directed"
    }
  ],
  ...
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "prescription_id": "12345",
    ...
  }
}
```

#### GET `/prescriptions`

Get all prescriptions from the database.

#### GET `/prescriptions/:id`

Get a specific prescription by ID.

### Webhooks

#### POST `/webhooks/signaturerx`

Receive webhook events from SignatureRx.

**Request Body:**

```json
{
  "event_type": "prescription.status_changed",
  "payload": {
    "prescription_id": "12345",
    "status": "Delivered"
  }
}
```

### Health Check

#### GET `/health`

Check if the API is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-16T10:04:34.000Z"
}
```

## 🔐 OAuth Flow

The application implements OAuth 2.0 Client Credentials flow:

1. **Token Request**: On startup or when token is missing
   - POST to `/oauth/token` with client credentials
   - Receives `access_token` and `refresh_token`
   - Calculates expiry time (with 5-minute buffer)

2. **Token Storage**: In-memory caching
   - Stores token with expiry timestamp
   - No persistence (for prototype security)

3. **Token Usage**: Automatic injection
   - Added as `Authorization: Bearer <token>` header
   - Used for all SignatureRx API calls

4. **Token Refresh**: Automatic on expiry
   - Checks expiry before each request
   - Uses refresh token if expired
   - Falls back to new token request if refresh fails

5. **Retry Logic**: On 401 errors
   - Refreshes token and retries once
   - Prevents infinite retry loops

## 📊 Database Schema

### Prescriptions Table

```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  api_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX prescriptions_status_idx ON prescriptions(status);
CREATE INDEX prescriptions_created_at_idx ON prescriptions(created_at);
```

**Status Values**: `Pending`, `Sent`, `Delivered`, `Failed`

## 🎨 Frontend Features

### Medication Selector

- Search functionality for medications
- Visual selection indicators
- SNOMED ID display
- Multiple medication selection

### Patient Form

- Mock data toggle for testing
- Validation for all required fields
- Auto-populated UK addresses
- Gender selection dropdown

### Prescription Status

- Real-time status display
- Color-coded status badges
- Success/error messaging
- Loading states

## 🔒 Security Considerations

### Implemented

- ✅ Environment variable for credentials (no hardcoding)
- ✅ HTTPS for production API calls
- ✅ Token expiry with buffer
- ✅ Automatic token refresh
- ✅ Input validation with Zod
- ✅ Type safety throughout

### Production Recommendations

- 🔐 Implement webhook signature verification
- 🔐 Add rate limiting
- 🔐 Use Redis for token storage (for multi-instance deployments)
- 🔐 Implement RBAC (Role-Based Access Control)
- 🔐 Add request/response encryption
- 🔐 Enable CORS whitelist for specific origins
- 🔐 Implement audit logging

## 📈 PACO Integration Readiness

This microservice is designed to integrate into the PACO platform as:

### Gateway Adapter Pattern

```
PACO Platform
    ├── API Gateway
    │   └── SignatureRx Adapter (this service)
    ├── Notification Service (webhook relay)
    ├── Prescription Service
    └── Patient Service
```

### Integration Points

1. **Authentication**: Centralized OAuth token management
2. **Prescription Issuance**: API calls to SignatureRx
3. **Webhook Relay**: Forward events to PACO Notification Service
4. **Data Persistence**: Store prescription records in PACO database

### Next Steps for Production

1. **Service Mesh Integration**: Add to Kubernetes/Docker Swarm
2. **Message Queue**: Use RabbitMQ/Kafka for async webhook processing
3. **API Gateway**: Register with Kong/NGINX
4. **Monitoring**: Add Prometheus metrics and Grafana dashboards
5. **Logging**: Centralize with ELK stack
6. **CI/CD**: Implement GitHub Actions pipeline

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### OAuth Token Errors

```bash
# Check credentials in .env
cat .env | grep SIGNATURERX

# Clear token cache (restart backend)
cd backend && npm run dev
```

### Frontend Not Connecting to Backend

Check Vite proxy configuration in `frontend/vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

## 📝 Development Notes

### Adding New Endpoints

1. Update `prescription/src/contracts/api.contract.ts`
2. Add route handler in `prescription/src/router.ts/`
3. Register in `backend/src/main.ts`
4. Update frontend API client

### Database Migrations

```bash
cd backend

# Create new migration
npm run migrate:create migration_name

# Run migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:down
```

### Testing API with cURL

```bash
# Health check
curl http://localhost:3000/health

# Issue prescription
curl -X POST http://localhost:3000/prescriptions/issue \
  -H "Content-Type: application/json" \
  -d @sample-payload.json
```

## 🎯 Project Status

**Status**: ✅ Prototype Complete (20-hour delivery)

**Completion Checklist**:

- [x] OAuth 2.0 Client Credentials Flow
- [ ] Token Management (Access + Refresh)
- [x] Prescription API Integration
- [x] Webhook Event Handling
- [x] Database Setup with Kysely
- [x] Frontend React UI
- [x] Unit & Integration Tests
- [x] Docker Configuration
- [ ] Comprehensive Documentation

---
