import "dotenv/config";

import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import Fastify from "fastify";
import { $db } from "./db/database";
import { redisClient } from "./libs/redis";
import { router } from "./router";
import {
  startTokenRefreshCron,
  stopTokenRefreshCron,
} from "./services/token-refresh-cron.service";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function main() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });
  const s = initServer();

  await app.register(s.plugin(router(app, s)));

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);

    // Start the token refresh cron job
    startTokenRefreshCron();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    stopTokenRefreshCron();
    await app.close();
    await $db().destroy();
    await redisClient.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
