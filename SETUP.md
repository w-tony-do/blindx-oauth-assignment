# Setup Guide - Blinx SignatureRx Integration

Complete step-by-step guide to set up and run the project.

## Prerequisites

Ensure you have the following installed:

- **Node.js**: v18 or higher
- **pnpm**: v9.0.0 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version

### Install pnpm (if not installed)

```bash
npm install -g pnpm@9
```

### Verify Installations

```bash
node --version    # Should be v18 or higher
pnpm --version    # Should be 9.0.0 or higher
docker --version  # Should be installed
```

---

## Step-by-Step Setup

### 1. Clone and Navigate to Project

```bash
cd /path/to/blindx
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspace packages:
- Root workspace
- `apps/backend`
- `apps/frontend`
- `packages/contracts`
- `packages/typescript-config`
- `packages/eslint-config`

### 3. Start PostgreSQL Database

Navigate to backend directory and start Docker services:

```bash
cd apps/backend
docker-compose up -d
```

**Verify database is running:**

```bash
docker-compose ps
```

You should see:
```
NAME                      STATUS
backend-postgres-1        running
```

**To view database logs:**

```bash
docker-compose logs -f postgres
```

**To stop database:**

```bash
docker-compose down
```

**To stop and remove data:**

```bash
docker-compose down -v
```

### 4. Configure Environment Variables

#### Backend Configuration

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx

# SignatureRx OAuth Configuration (REQUIRED - Get from SignatureRx)
SIGNATURERX_CLIENT_ID=your_actual_client_id
SIGNATURERX_CLIENT_SECRET=your_actual_client_secret
SIGNATURERX_BASE_URL=https://app.signaturerx.co.uk
SIGNATURERX_TOKEN_URL=https://app.signaturerx.co.uk/oauth/token
SIGNATURERX_API_URL=https://app.signaturerx.co.uk/api

# SignatureRx Configuration
SIGNATURERX_CLINIC_ID=842
```

⚠️ **Important**: Replace `your_actual_client_id` and `your_actual_client_secret` with your real SignatureRx credentials.

#### Frontend Configuration

```bash
cd apps/frontend
cp .env.example .env
```

The default values should work:

```env
VITE_API_URL=http://localhost:3001
VITE_SIGNATURERX_CLINIC_ID=842
```

### 5. Run Database Migrations

Navigate to backend and run migrations:

```bash
cd apps/backend
pnpm db:migrate
```

You should see:
```
✅ Migration "001_initial_schema" was executed successfully
✅ All migrations completed successfully
```

**To check migration status:**

Connect to the database and verify tables:

```bash
docker exec -it backend-postgres-1 psql -U blinx -d blinx_signaturerx
```

Then run:
```sql
\dt
```

You should see:
```
 public | prescriptions    | table | blinx
 public | webhook_events   | table | blinx
```

Exit with: `\q`

### 6. Build Shared Packages

Build the contracts package first:

```bash
cd packages/contracts
pnpm build
```

### 7. Start Development Servers

From the **root directory**:

```bash
pnpm dev
```

This will start:
- ✅ Backend API: http://localhost:3001
- ✅ Frontend UI: http://localhost:3000

**Alternative: Start services individually**

Terminal 1 - Backend:
```bash
cd apps/backend
pnpm dev
```

Terminal 2 - Frontend:
```bash
cd apps/frontend
pnpm dev
```

---

## Verification

### 1. Test Backend Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T16:00:00.000Z"
}
```

### 2. Test Frontend

Open browser: http://localhost:3000

You should see:
- 🏥 Blinx PACO - SignatureRx Integration header
- Prescription form on the left
- Prescription history on the right

### 3. Test Medication List

```bash
curl http://localhost:3001/api/medications
```

Should return a list of medications.

### 4. Check Database Connection

The backend logs should show:
```
🚀 Server running on http://localhost:3001
📚 API endpoints available at http://localhost:3001/api
💡 SignatureRx OAuth Status: { hasToken: false, expiresAt: null, isExpired: true }
```

---

## Running Tests

### Unit Tests

```bash
cd apps/backend
pnpm test
```

### Watch Mode

```bash
cd apps/backend
pnpm test -- --watch
```

### Type Checking

From root:
```bash
pnpm check-types
```

### Linting

From root:
```bash
pnpm lint
```

---

## Building for Production

### Build All Apps

From root:
```bash
pnpm build
```

### Build Individual Apps

Backend:
```bash
cd apps/backend
pnpm build
```

Frontend:
```bash
cd apps/frontend
pnpm build
```

### Run Production Build

Backend:
```bash
cd apps/backend
pnpm start
```

---

## Troubleshooting

### Issue: Database Connection Failed

**Error:**
```
Failed to connect to database
```

**Solutions:**

1. Check if PostgreSQL is running:
```bash
docker-compose ps
```

2. Restart database:
```bash
docker-compose down
docker-compose up -d
```

3. Check DATABASE_URL in `.env`:
```env
DATABASE_URL=postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx
```

4. Test connection directly:
```bash
docker exec -it backend-postgres-1 psql -U blinx -d blinx_signaturerx -c "SELECT 1;"
```

### Issue: Port Already in Use

**Error:**
```
Port 3001 is already in use
```

**Solutions:**

1. Find and kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

2. Or change port in `apps/backend/.env`:
```env
PORT=3002
```

### Issue: Module Not Found

**Error:**
```
Cannot find module '@repo/contracts'
```

**Solutions:**

1. Build contracts package:
```bash
cd packages/contracts
pnpm build
```

2. Reinstall dependencies:
```bash
pnpm install
```

### Issue: OAuth Authentication Failed

**Error:**
```
Failed to fetch token: 401
```

**Solutions:**

1. Verify credentials in `apps/backend/.env`
2. Check if CLIENT_ID and CLIENT_SECRET are correct
3. Check SignatureRx API status
4. Review backend logs for detailed error

### Issue: Frontend Can't Connect to Backend

**Error in browser console:**
```
Failed to fetch
```

**Solutions:**

1. Verify backend is running on port 3001
2. Check CORS configuration in backend
3. Verify proxy settings in `apps/frontend/vite.config.ts`
4. Check browser network tab for exact error

### Issue: Migrations Failed

**Error:**
```
Migration failed: relation already exists
```

**Solutions:**

1. Drop and recreate database:
```bash
cd apps/backend
docker-compose down -v
docker-compose up -d
pnpm db:migrate
```

2. Or connect and drop tables manually:
```bash
docker exec -it backend-postgres-1 psql -U blinx -d blinx_signaturerx
```

Then:
```sql
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
\q
```

Then run migrations again:
```bash
pnpm db:migrate
```

---

## Development Workflow

### Daily Development

1. Start database:
```bash
cd apps/backend && docker-compose up -d
```

2. Start dev servers:
```bash
cd ../.. && pnpm dev
```

3. Make changes to code (hot reload is enabled)

4. Run tests:
```bash
cd apps/backend && pnpm test
```

### Making Schema Changes

1. Create new migration:
```bash
cd apps/backend/src/db/migrations
# Create file: 002_your_migration_name.ts
```

2. Write migration:
```typescript
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Your migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Rollback code
}
```

3. Run migration:
```bash
pnpm db:migrate
```

### Adding New API Endpoints

1. Update contract in `packages/contracts/src/index.ts`
2. Build contracts: `cd packages/contracts && pnpm build`
3. Implement handler in `apps/backend/src/index.ts`
4. Update frontend to use new endpoint

---

## Useful Commands

### Database Commands

```bash
# Start database
cd apps/backend && docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Access database
docker exec -it backend-postgres-1 psql -U blinx -d blinx_signaturerx

# Backup database
docker exec backend-postgres-1 pg_dump -U blinx blinx_signaturerx > backup.sql

# Restore database
cat backup.sql | docker exec -i backend-postgres-1 psql -U blinx -d blinx_signaturerx
```

### Development Commands

```bash
# Start all services
pnpm dev

# Build all
pnpm build

# Lint all
pnpm lint

# Type check all
pnpm check-types

# Run tests
cd apps/backend && pnpm test

# Watch mode
cd apps/backend && pnpm test -- --watch
```

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | 3001 | No |
| `NODE_ENV` | Environment | development | No |
| `DATABASE_URL` | PostgreSQL connection string | See .env.example | Yes |
| `SIGNATURERX_CLIENT_ID` | OAuth client ID | - | Yes |
| `SIGNATURERX_CLIENT_SECRET` | OAuth client secret | - | Yes |
| `SIGNATURERX_BASE_URL` | SignatureRx base URL | https://app.signaturerx.co.uk | Yes |
| `SIGNATURERX_TOKEN_URL` | OAuth token endpoint | https://app.signaturerx.co.uk/oauth/token | Yes |
| `SIGNATURERX_API_URL` | API base URL | https://app.signaturerx.co.uk/api | Yes |
| `SIGNATURERX_CLINIC_ID` | Clinic ID | 842 | Yes |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | http://localhost:3001 | No |
| `VITE_SIGNATURERX_CLINIC_ID` | Clinic ID | 842 | Yes |

---

## Next Steps

1. ✅ Get SignatureRx API credentials
2. ✅ Configure environment variables
3. ✅ Test prescription creation via UI
4. ✅ Test webhook handling
5. ✅ Review API documentation
6. ✅ Run test suite

---

## Support

If you encounter issues not covered here:

1. Check backend logs for errors
2. Check browser console for frontend errors
3. Review API_TESTING.md for request examples
4. Check README.md for architecture details

For SignatureRx API questions:
- API Docs: https://app.signaturerx.co.uk/api/docs.html
- Webhook Docs: https://stage-srx.signaturerx.co.uk/docs/webhooks
