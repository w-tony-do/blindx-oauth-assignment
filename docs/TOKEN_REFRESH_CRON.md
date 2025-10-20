# Token Refresh Cron Service

## Overview
A background service that periodically checks the SignatureRx token expiration in Redis and automatically refreshes it before it expires.

## Features
- Checks token expiration every 5 minutes (configurable)
- Automatically refreshes tokens when they have less than 10 minutes remaining (configurable)
- Runs on application startup
- Graceful shutdown on SIGINT/SIGTERM

## Configuration

Environment variables:

```bash
# Check interval in minutes (default: 5)
TOKEN_CHECK_INTERVAL_MINUTES=5

# Refresh threshold in minutes (default: 10)
# Token will be refreshed when it has less than this time remaining
TOKEN_REFRESH_THRESHOLD_MINUTES=10
```

## Implementation Details

### Files Created/Modified

1. **src/services/token-refresh-cron.service.ts** (new)
   - Contains the cron service logic
   - Exports `startTokenRefreshCron()` and `stopTokenRefreshCron()`

2. **src/services/signaturerx.service.ts** (modified)
   - Added `refreshNewToken()` method for proactive token refresh
   - Exported `getTokenFromRedis()` for cron service access

3. **src/main.ts** (modified)
   - Starts cron service after server starts
   - Stops cron service during graceful shutdown

## How It Works

1. On startup, the cron runs immediately to check token status
2. Every N minutes (default 5), it checks the token expiration time
3. If token expires in less than M minutes (default 10), it refreshes the token
4. Uses existing `refreshNewToken()` method which:
   - Attempts to use refresh token if available
   - Falls back to fetching a new token if refresh fails
   - Handles case when no token exists

## Logs

The service logs all activities with prefix `[Token Refresh Cron]`:
- ⏰ Token check status
- ✅ Successful refresh
- ❌ Errors
- 🚀 Service start
- 🛑 Service stop
