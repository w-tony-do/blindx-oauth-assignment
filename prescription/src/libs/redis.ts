import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log("🟡 REDIS_URL: ", REDIS_URL);

export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  lazyConnect: false,
  retryStrategy(times) {
    if (times > 50) {
      console.error("❌ Redis max retries exceeded");
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  // DNS resolution options for Linux compatibility
  family: 4, // Force IPv4 to avoid IPv6 DNS issues
  connectTimeout: 10000, // 10 second timeout for initial connection
  keepAlive: 30000,
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export const REDIS_KEYS = {
  SIGNATURERX_TOKEN: "signaturerx:token",
} as const;
