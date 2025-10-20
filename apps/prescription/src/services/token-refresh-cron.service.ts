import { refreshNewToken } from "./signaturerx.service";

// Check every 5 minutes (configurable via env)
const CHECK_INTERVAL_MS =
  parseInt(process.env.TOKEN_CHECK_INTERVAL_MINUTES || "1", 10) * 60 * 1000;

let intervalId: NodeJS.Timeout | null = null;

export function startTokenRefreshCron(): void {
  if (intervalId) {
    console.log("⚠️  [Token Refresh Cron] Already running");
    return;
  }

  console.log(
    `🚀 [Token Refresh Cron] Starting - checking every ${CHECK_INTERVAL_MS / 60000} minutes`,
  );

  // Then run periodically
  intervalId = setInterval(refreshNewToken, CHECK_INTERVAL_MS);
}

export function stopTokenRefreshCron(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 [Token Refresh Cron] Stopped");
  }
}
