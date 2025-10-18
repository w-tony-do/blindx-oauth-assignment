# Blinx Healthcare - SignatureRx OAuth Integration

Full-stack prototype demonstrating OAuth 2.0 Client Credentials integration between Blinx PACO platform and SignatureRx for secure prescription management.

## 🎯 Project Overview

This project implements a complete prescription management system with:
- **OAuth 2.0 authentication** with SignatureRx (Client Credentials + Refresh Token flow)
- **Secure token management** with automatic expiry handling and refresh
- **Prescription API integration** for issuing prescriptions for delivery
- **Webhook handling** for real-time prescription status updates
- **Type-safe contracts** using ts-rest for frontend-backend communication
- **Database persistence** with Kysely and PostgreSQL
- **Modern React UI** for creating and managing prescriptions

## 📁 Project Structure

```
blindx/
├── apps/
│   ├── backend/          # Node.js + Fastify + ts-rest API
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── migrations/     # Kysely database migrations
│   │   │   │   ├── database.ts     # Database client setup
│   │   │   │   └── migrate.ts      # Migration runner
│   │   │   ├── services/
│   │   │   │   ├── signaturerx.service.ts    # OAuth & API calls
│   │   │   │   ├── prescription.service.ts   # Prescription logic
│   │   │   │   └── webhook.service.ts        # Webhook handling
│   │   │   ├── data/
│   │   │   │   └── medications.ts   # Sample medication data
│   │   │   └── index.ts            # Main server
│   │   ├── docker-compose.yaml     # PostgreSQL setup
│   │   └── package.json
│   └── frontend/         # React + Vite + TypeScript
│       ├── src/
│       │   ├── components/
│       │   │   ├── PrescriptionForm.tsx
│       │   │   └── PrescriptionList.tsx
│       │   ├── api/
│       │   │   └── client.ts       # Type-safe API client
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
├── packages/
│   ├── contracts/        # Shared ts-rest API contracts
│   │   └── src/
│   │       └── index.ts  # Type-safe contract definitions
│   ├── typescript-config/
│   └── eslint-config/
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- Docker & Docker Compose (for database)
- SignatureRx API credentials (client_id & client_secret)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

Start PostgreSQL using Docker:

```bash
cd apps/backend
docker-compose up -d
```

### 3. Configure Environment Variables

**Backend** (`apps/backend/.env`):

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and add your SignatureRx credentials:

```env
PORT=3001
NODE_ENV=development

DATABASE_URL=postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx

# Replace with your actual credentials
SIGNATURERX_CLIENT_ID=your_client_id_here
SIGNATURERX_CLIENT_SECRET=your_client_secret_here
SIGNATURERX_BASE_URL=https://app.signaturerx.co.uk
SIGNATURERX_TOKEN_URL=https://app.signaturerx.co.uk/oauth/token
SIGNATURERX_API_URL=https://app.signaturerx.co.uk/api

SIGNATURERX_CLINIC_ID=842
```

**Frontend** (`apps/frontend/.env`):

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

### 4. Run Database Migrations

```bash
cd apps/backend
pnpm db:migrate
```

### 5. Start Development Servers

From the root directory:

```bash
pnpm dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend UI: http://localhost:3000

## 📚 API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Medications
- `GET /api/medications` - List available medications

### Prescriptions
- `POST /api/prescriptions/issue` - Create and issue a prescription
- `GET /api/prescriptions` - List all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID

### Webhooks
- `POST /api/webhooks/signaturerx` - Receive webhook events from SignatureRx

## 🔐 OAuth Flow Implementation

### Token Management

The `SignatureRxService` handles the complete OAuth flow:

1. **Initial Authentication**: Fetches access token using client credentials
2. **Token Caching**: Stores token in memory with expiry tracking
3. **Automatic Refresh**: Refreshes token before expiry
4. **Retry Logic**: Automatically retries failed requests with new token

```typescript
// Token is automatically managed
const token = await signatureRxService.getAccessToken();
// Returns cached token if valid, refreshes if expired, or fetches new
```

### Methods

- `getAccessToken()` - Get valid access token (handles refresh automatically)
- `issuePrescription(payload)` - Issue prescription with automatic token handling
- `getTokenStatus()` - Get current token status for debugging

## 💊 Creating a Prescription

### Example Request

```json
POST /api/prescriptions/issue
{
  "action": "issueForDelivery",
  "clinic_id": 842,
  "secure_pin": "111111",
  "notify": true,
  "send_sms": true,
  "patient": {
    "first_name": "John",
    "last_name": "Doe",
    "gender": "male",
    "email": "john@example.com",
    "phone": "441234567890",
    "birth_day": "15",
    "birth_month": "06",
    "birth_year": "1985",
    "address_ln1": "123 High Street",
    "city": "London",
    "post_code": "SW1A 1AA",
    "country": "United Kingdom"
  },
  "delivery_address": {
    "address_ln1": "123 High Street",
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
      "directions": "Take as directed"
    }
  ]
}
```

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Sent",
  "prescription_id": "SRX-12345",
  "created_at": "2025-10-18T16:00:00Z"
}
```

## 🔔 Webhook Events

Webhooks update prescription status in real-time:

```json
POST /api/webhooks/signaturerx
{
  "event_type": "prescription.status_updated",
  "prescription_id": "SRX-12345",
  "status": "Delivered",
  "data": {
    "tracking_number": "TRACK123",
    "updated_at": "2025-10-18T18:00:00Z"
  },
  "timestamp": "2025-10-18T18:00:00Z"
}
```

## 🧪 Testing

### Unit Tests

```bash
cd apps/backend
pnpm test
```

### Integration Tests

```bash
cd apps/backend
pnpm test:integration
```

Tests cover:
- OAuth token fetching and refresh
- Token caching behavior
- Prescription creation
- Error handling and retries

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
```

## 🏗️ Architecture & PACO Integration

### Current Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │─────▶│   Fastify    │─────▶│  SignatureRx    │
│   Frontend  │      │   Backend    │      │     API         │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  PostgreSQL  │
                     └──────────────┘
```

### PACO Integration Readiness

This service is designed as a **microservice adapter** that would integrate into PACO:

**As a Gateway Service:**
1. Handles all SignatureRx OAuth and API communication
2. Manages token lifecycle independently
3. Provides REST API for other PACO services
4. Persists prescription data for audit trail

**Integration Points:**
- **Notification Service**: Webhook events relay to PACO's notification system
- **Patient Service**: Patient data sourced from PACO's patient database
- **Prescriber Service**: Prescription requests initiated by PACO prescriber module
- **Audit Service**: All API calls logged for compliance

**Deployment Considerations:**
- Run as separate container/service
- Credentials managed via secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Database migrations handled via CI/CD pipeline
- Health checks for Kubernetes/Docker orchestration

## 🛠️ Development Commands

```bash
# Root commands (runs all apps)
pnpm dev              # Start all dev servers
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm check-types      # Type check all apps

# Backend specific
cd apps/backend
pnpm dev              # Start backend dev server
pnpm build            # Build backend
pnpm test             # Run unit tests
pnpm db:migrate       # Run database migrations

# Frontend specific
cd apps/frontend
pnpm dev              # Start frontend dev server
pnpm build            # Build frontend
```

## 🔒 Security Considerations

### Implemented
- ✅ Environment variables for sensitive credentials
- ✅ No hardcoded secrets
- ✅ Token stored in memory (not persisted)
- ✅ CORS configured
- ✅ Input validation with Zod schemas
- ✅ Type-safe contracts between frontend and backend

### Production Recommendations
- Use secrets manager (AWS Secrets Manager, Vault)
- Implement token encryption at rest if persisting
- Add rate limiting
- Implement request signing for webhooks
- Use HTTPS only
- Add authentication/authorization for API endpoints
- Implement audit logging
- Add request/response encryption

## 📝 Technical Decisions

### Why ts-rest?
- Type-safe contracts shared between frontend and backend
- Eliminates API documentation drift
- Auto-completion and type checking
- Single source of truth for API structure

### Why Kysely?
- Type-safe SQL query builder
- Better than ORMs for complex queries
- Migration support
- Minimal overhead

### Why Fastify?
- High performance
- Native TypeScript support
- Rich plugin ecosystem
- Excellent ts-rest integration

## 🎨 Frontend Features

- **Medication Selection**: Dropdown with all available medications
- **Patient Form**: Pre-filled mock data for testing
- **Delivery Address**: Option to use same as patient address
- **Real-time Updates**: Prescription list updates after creation
- **Status Badges**: Visual indicators for prescription status
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: User-friendly error messages

## 📊 Future Enhancements

- [ ] Persistent token cache (Redis)
- [ ] Token expiry scheduler with cron
- [ ] Webhook signature verification
- [ ] CLI tool for testing
- [ ] Docker deployment configuration
- [ ] Comprehensive integration tests
- [ ] API rate limiting
- [ ] Request logging and monitoring
- [ ] GraphQL API option
- [ ] Real-time updates via WebSockets

## 🤝 Contributing

This is a technical assessment project. For production use:

1. Add comprehensive test coverage
2. Implement production security measures
3. Add monitoring and observability
4. Configure CI/CD pipelines
5. Add load testing
6. Implement caching strategies

## 📄 License

This project is created as part of a technical assessment for Blinx Healthcare.

## 📞 Support

For questions about SignatureRx API integration:
- API Docs: https://app.signaturerx.co.uk/api/docs.html
- Webhook Docs: https://stage-srx.signaturerx.co.uk/docs/webhooks

---

**Built with**: TypeScript, Node.js, Fastify, React, Vite, PostgreSQL, Kysely, ts-rest, Docker
