import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import { contract } from "@repo/contracts";
import { createDatabase } from "./db/database.js";
import * as signatureRxService from "./services/signaturerx.service.js";
import * as prescriptionService from "./services/prescription.service.js";
import * as webhookService from "./services/webhook.service.js";
import { medications } from "./data/medications.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx";

async function main() {
  // Initialize Fastify
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

  // Register CORS
  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Initialize database
  const db = createDatabase(DATABASE_URL);

  // Initialize ts-rest server
  const s = initServer();

  // Create router
  const router = s.router(contract, {
    // Health check
    health: {
      check: async () => {
        return {
          status: 200,
          body: {
            status: "ok",
            timestamp: new Date().toISOString(),
          },
        };
      },
    },

    // Medications endpoints
    medications: {
      list: async () => {
        return {
          status: 200,
          body: {
            meds: medications,
            total: medications.length,
          },
        };
      },
    },

    // Prescriptions endpoints
    prescriptions: {
      create: async ({ body }) => {
        try {
          const prescription =
            await prescriptionService.createPrescription(db, body);

          return {
            status: 200,
            body: {
              id: prescription.id,
              status: prescription.status,
              prescription_id:
                prescription.signaturerx_prescription_id || undefined,
              created_at: prescription.created_at,
            },
          };
        } catch (error: any) {
          app.log.error("Failed to create prescription:", error);

          if (error.message?.includes("401")) {
            return {
              status: 401,
              body: { error: "Authentication failed with SignatureRx" },
            };
          }

          return {
            status: 500,
            body: { error: error.message || "Failed to create prescription" },
          };
        }
      },

      list: async () => {
        const prescriptions = await prescriptionService.listPrescriptions(db);

        return {
          status: 200,
          body: {
            prescriptions,
            total: prescriptions.length,
          },
        };
      },

      getById: async ({ params }) => {
        const prescription = await prescriptionService.getPrescriptionById(
          db,
          params.id,
        );

        if (!prescription) {
          return {
            status: 404,
            body: { error: "Prescription not found" },
          };
        }

        return {
          status: 200,
          body: prescription,
        };
      },
    },

    webhooks: {
      signaturerx: async ({ body }) => {
        try {
          await webhookService.handleWebhookEvent(db, body);

          return {
            status: 200,
            body: {
              received: true,
              message: "Webhook event processed successfully",
            },
          };
        } catch (error: any) {
          app.log.error("Failed to process webhook:", error);

          return {
            status: 400,
            body: { error: error.message || "Failed to process webhook" },
          };
        }
      },
    },
  });

  await app.register(s.plugin(router));

  // Start server
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
    console.log(
      `\n💡 SignatureRx OAuth Status:`,
      signatureRxService.getTokenStatus(),
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await app.close();
    await db.destroy();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
