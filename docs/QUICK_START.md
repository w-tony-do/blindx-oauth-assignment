# Quick Start Guide

Get the Blinx SignatureRx integration running in 5 minutes!

## Prerequisites Check

```bash
node --version   # Should be v18+
pnpm --version   # Should be 9.0.0+
docker --version # Should be installed
```

## 🚀 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
pnpm install
```

### 2. Start Database (30 seconds)

```bash
cd apps/backend
docker-compose up -d
```

### 3. Configure Environment (1 min)

**Backend:**
```bash
cd apps/backend
cp .env.example .env
```

Edit `.env` and add your SignatureRx credentials:
```env
SIGNATURERX_CLIENT_ID=your_client_id
SIGNATURERX_CLIENT_SECRET=your_client_secret
```

**Frontend:**
```bash
cd apps/frontend
cp .env.example .env
# Default values are fine
```

### 4. Run Migrations (30 seconds)

```bash
cd apps/backend
pnpm db:migrate
```

### 5. Start Servers (30 seconds)

From root directory:
```bash
pnpm dev
```

### 6. Test It! (1 min)

**Backend:**
```bash
curl http://localhost:3001/api/health
```

**Frontend:**
Open browser: http://localhost:3000

**Create a Prescription:**
1. Select "Sildenafil 25mg tablets" from dropdown
2. Click "Create Prescription"
3. See it appear in the list!

---

## 📝 Quick Commands

```bash
# Start everything
pnpm dev

# Run tests
cd apps/backend && pnpm test

# Check database
docker exec -it backend-postgres-1 psql -U blinx -d blinx_signaturerx

# View logs
cd apps/backend && docker-compose logs -f postgres

# Stop everything
cd apps/backend && docker-compose down
```

---

## 🔍 Quick Test

### Test Health Endpoint
```bash
curl http://localhost:3001/api/health
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

### Port 3001 in use?
```bash
lsof -ti:3001 | xargs kill -9
```

### Database connection failed?
```bash
cd apps/backend
docker-compose down
docker-compose up -d
```

### Module not found?
```bash
pnpm install
cd packages/contracts && pnpm build
```

### Fresh start?
```bash
cd apps/backend
docker-compose down -v
docker-compose up -d
pnpm db:migrate
cd ../..
pnpm dev
```

---

## 📚 Next Steps

1. **Read README.md** for full documentation
2. **Check SETUP.md** for detailed setup
3. **Review API_TESTING.md** for API examples
4. **Explore IMPLEMENTATION_SUMMARY.md** for technical details

---

## 🎯 What's Running?

After `pnpm dev`:

- ✅ Backend API: http://localhost:3001
- ✅ Frontend UI: http://localhost:3000
- ✅ PostgreSQL: localhost:5432
- ✅ API Docs: See API_TESTING.md

---

## 📦 Project Structure

```
blindx/
├── apps/
│   ├── backend/      # Fastify API with OAuth
│   └── frontend/     # React UI
├── packages/
│   └── contracts/    # Shared types
└── docs/            # README, SETUP, etc.
```

---

## ⚡ Quick Tips

1. **Hot Reload**: Code changes auto-reload
2. **Mock Data**: Patient form pre-filled for testing
3. **Logs**: Backend shows OAuth flow in console
4. **Database**: View data at any time
5. **Types**: Full TypeScript support

---

## 🎉 You're Ready!

Visit http://localhost:3000 and start creating prescriptions!

For detailed documentation, see **README.md**.
