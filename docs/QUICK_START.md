# Quick Start Guide

Get the Blindx SignatureRx integration running in 5 minutes!

## Prerequisites Check

```bash
node --version   # Should be v18+
pnpm --version   # Should be 10.0.0+
docker --version # Should be installed
```

## 🚀 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
pnpm install
```

### 2. Start Infrastructure Services (30 seconds)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Configure Environment Variables (1 min)

Create `.env` file in the **root directory**:

```bash
cp .env.example .env
```

Edit `.env` and add your SignatureRx credentials:

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

**Optional - Frontend Environment:**

If you want to customize the frontend API URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

*Note: The frontend defaults to `http://localhost:3001` if not specified.*

### 4. Run Database Migrations (30 seconds)

```bash
pnpm db:migrate
```

### 5. Start Development Servers (30 seconds)

**Backend API:**

```bash
pnpm api:dev
```

Backend runs on `http://localhost:3001`

**Frontend UI (in another terminal):**

```bash
pnpm ui:dev
```

Frontend runs on `http://localhost:5173`

### 6. Test It! (1 min)

**Backend Health Check:**

```bash
curl http://localhost:3001/api/health
```

**Frontend:**
Open browser: http://localhost:5173

**Create a Prescription:**

1. Select "Sildenafil 25mg tablets" from dropdown
2. Fill in patient details (or use pre-filled mock data)
3. Click "Create Prescription"
4. See it appear in the list!

---

## 📝 Quick Commands

```bash
# Backend
pnpm api:dev          # Start backend in dev mode
pnpm api:build        # Build backend for production
pnpm api:start        # Run production build
pnpm api:test         # Run backend tests
pnpm api:coverage     # Run tests with coverage

# Frontend
pnpm ui:dev           # Start frontend in dev mode
pnpm ui:build         # Build frontend for production
pnpm ui:test          # Run frontend tests
pnpm ui:coverage      # Run tests with coverage

# Database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with test data
pnpm db:generate      # Generate Kysely types

# Code Quality
pnpm lint             # Lint all TypeScript files
pnpm typecheck        # Check TypeScript types

# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose down -v            # Stop and remove volumes
docker-compose logs -f postgres   # View PostgreSQL logs
docker-compose logs -f redis      # View Redis logs
```

---

## 🔍 Quick API Tests

### Test Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Medications List

```bash
curl http://localhost:3001/api/medications
```

### Test Prescription Creation

```bash
curl -X POST http://localhost:3001/api/prescriptions/issue \
  -H "Content-Type: application/json" \
  -d '{
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
      "email": "test@example.com",
      "phone": "441234567890",
      "birth_day": "15",
      "birth_month": "06",
      "birth_year": "1985",
      "address_ln1": "123 Test St",
      "city": "London",
      "post_code": "SW1A 1AA",
      "country": "United Kingdom"
    },
    "delivery_address": {
      "address_ln1": "123 Test St",
      "city": "London",
      "post_code": "SW1A 1AA",
      "country": "United Kingdom"
    },
    "medicines": [{
      "object": "medicine",
      "id": 0,
      "VPID": "42089511000001103",
      "description": "Sildenafil 25mg tablets",
      "qty": "10",
      "directions": "Take as directed"
    }]
  }'
```

---

## 🐛 Quick Troubleshooting

### Port 3001 already in use?

```bash
lsof -ti:3001 | xargs kill -9
pnpm api:dev
```

### Port 5173 already in use?

```bash
lsof -ti:5173 | xargs kill -9
pnpm ui:dev
```

### Database connection failed?

```bash
docker-compose down
docker-compose up -d
# Wait 5 seconds for PostgreSQL to start
sleep 5
pnpm db:migrate
```

### Redis connection failed?

```bash
docker-compose restart redis
```

### Module not found errors?

```bash
pnpm install
```

### Database migration issues?

```bash
# Reset database completely
docker-compose down -v
docker-compose up -d
sleep 5
pnpm db:migrate
```

### OAuth token errors?

Check your `.env` file:
- Ensure `SIGNATURERX_CLIENT_ID` is set
- Ensure `SIGNATURERX_CLIENT_SECRET` is set
- Or set `SIGNATURERX_MOCK=true` for testing without real API

### Fresh start (nuclear option)?

```bash
# Stop everything and clean up
docker-compose down -v
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall and restart
pnpm install
docker-compose up -d
sleep 5
pnpm db:migrate
pnpm api:dev  # In one terminal
pnpm ui:dev   # In another terminal
```

---

## 📦 Project Structure

```
blindx/
├── prescription/          # Backend Fastify API
│   └── src/
│       ├── __tests__/     # Backend tests
│       ├── data/          # Static data (medications)
│       ├── helpers/       # Utility functions
│       ├── libs/          # Database & Redis
│       ├── services/      # Business logic
│       ├── types/         # TypeScript types
│       ├── main.ts        # Server entry point
│       └── router.ts      # API routes
├── frontend/              # React UI
│   └── src/
│       ├── __tests__/     # Frontend tests
│       ├── api/           # API client
│       ├── components/    # React components
│       ├── types/         # Frontend types
│       ├── App.tsx        # Main app component
│       └── main.tsx       # Entry point
├── shared/                # Shared code
│   └── contract.ts        # API contract (ts-rest)
├── docs/                  # Documentation
├── docker-compose.yaml    # Dev services
└── package.json           # Root package with scripts
```

---

## 🎯 What's Running?

After `pnpm api:dev` and `pnpm ui:dev`:

- ✅ Backend API: http://localhost:3001
- ✅ Frontend UI: http://localhost:5173
- ✅ PostgreSQL: localhost:5432
- ✅ Redis: localhost:6379

---

## ⚡ Quick Tips

1. **Hot Reload**: Both backend and frontend auto-reload on code changes
2. **Mock Mode**: Set `SIGNATURERX_MOCK=true` to test without SignatureRx API
3. **Logs**: Backend uses pino-pretty for readable logs
4. **Database**: Use any PostgreSQL client to connect and inspect data
5. **Types**: Full TypeScript support with shared contract between frontend/backend
6. **Tests**: Run `pnpm api:test` or `pnpm ui:test` anytime
7. **Token Refresh**: Automatic OAuth token refresh runs every 5 minutes

---

## 🧪 Running Tests

```bash
# Backend tests (Jest)
pnpm api:test              # Run once
pnpm api:watch-test        # Watch mode
pnpm api:coverage          # With coverage report

# Frontend tests (Vitest)
pnpm ui:test               # Run once
pnpm ui:watch-test         # Watch mode
pnpm ui:coverage           # With coverage report

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## 📊 Database Access

### Using Docker exec:

```bash
docker exec -it blindx-postgres-1 psql -U blinx -d blinx_signaturerx
```

### Common queries:

```sql
-- List all prescriptions
SELECT * FROM prescriptions;

-- List webhook events
SELECT * FROM webhook_events;

-- Check prescription count
SELECT COUNT(*) FROM prescriptions;
```

---

## 🎉 You're Ready!

Visit http://localhost:5173 and start creating prescriptions!

For detailed documentation, see:
- **README.md** - Complete project documentation
- **TOKEN_REFRESH_CRON.md** - OAuth token refresh details
- **API_TESTING.md** - API endpoint examples

---

## 🚀 Next Steps

1. **Explore the UI**: Create prescriptions through the web interface
2. **Test the API**: Use the curl examples above or Postman
3. **Read the code**: Check out `prescription/src/main.ts` and `frontend/src/App.tsx`
4. **Run tests**: Ensure everything works with `pnpm api:test` and `pnpm ui:test`
5. **Check logs**: Watch the terminal for OAuth flow and API requests
6. **Deploy**: See README.md for Docker production deployment

Happy coding! 🎊
