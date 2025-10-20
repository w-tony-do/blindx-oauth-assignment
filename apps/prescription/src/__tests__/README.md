# API Test Suite

This test suite provides comprehensive coverage for the prescription API using vitest.

## Test Files

### 1. `/src/__tests__/setup.ts`
Common test utilities and mock data for all tests:
- Database setup and cleanup functions
- Redis setup and cleanup functions
- Mock data for patients, prescriptions, medications
- Global test hooks (beforeAll, beforeEach, afterAll)

### 2. `/src/__tests__/signaturerx-redis.test.ts`
Tests for SignatureRx service with Redis token storage:
- Token fetching and caching in Redis
- Token refresh mechanism
- Token TTL management
- Error handling for Redis failures
- Config management
- **Status**: ✅ Passing (14 tests)

### 3. `/src/__tests__/prescription.test.ts`
Tests for prescription service:
- Creating prescriptions
- Listing prescriptions
- Getting prescriptions by ID
- Updating prescription status
- Issuing prescriptions to SignatureRx API
- Retry logic for failed requests
- **Status**: ✅ Passing (15 tests)

### 4. `/src/__tests__/webhook.test.ts`
Tests for webhook event handling:
- Processing status update webhooks
- Handling different event types (created, cancelled, delivered, etc.)
- Graceful handling of missing data
- Validation of webhook payloads
- **Status**: ✅ Passing (10 tests)

### 5. `/src/__tests__/api.test.ts`
Integration tests for API endpoints:
- Health check endpoint
- Medications listing
- Prescription CRUD operations
- Webhook endpoints
- **Status**: ⚠️ Needs route configuration fixes (currently 404s)

### 6. `/src/services/__tests__/signaturerx.service.test.ts`
Updated unit tests for SignatureRx service:
- Token management with Redis
- **Status**: ✅ Passing (3 tests)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in CI mode (no watch)
pnpm test -- --run

# Run specific test file
pnpm test -- --run src/__tests__/prescription.test.ts

# Run with coverage
pnpm test -- --coverage
```

## Test Configuration

Tests are configured in `vitest.config.ts` with:
- Node environment
- Single fork execution to avoid race conditions
- Test file pattern: `src/**/*.test.ts`
- Coverage reporting with v8

## Test Coverage

Current status:
- **39 passing tests** out of 55
- Core business logic fully covered:
  - ✅ SignatureRx OAuth token management with Redis
  - ✅ Prescription CRUD operations
  - ✅ Webhook event processing
  - ✅ Error handling and retries
  - ⚠️ API integration tests need route fixes

## Key Features Tested

1. **Redis Token Storage**:
   - Tokens are cached in Redis with automatic TTL
   - Refresh token flow
   - Fallback to new token fetch if refresh fails

2. **Prescription Management**:
   - Full CRUD operations
   - Integration with SignatureRx API
   - Automatic retry on 401 errors

3. **Webhook Processing**:
   - Status updates from SignatureRx
   - Multiple event types
   - Graceful error handling

4. **Mocking**:
   - External API calls mocked with vitest
   - Database cleaned between tests
   - Redis flushed between tests

## Dependencies

- `vitest`: Test framework
- `@fastify/inject`: For API testing (used in api.test.ts)
- `ioredis`: Redis client
- `kysely`: Database query builder
