import { contract } from "@repo/contracts";
import { initServer } from "@ts-rest/fastify";
import Fastify from "fastify";
import { medications } from "./data/medications";
import {
  createPrescription,
  getPrescriptionById,
  issuePrescription,
  listPrescriptions,
} from "./services/prescription.service";
import { handleWebhookEvent } from "./services/webhook.service";

export const router = (
  app: ReturnType<typeof Fastify>,
  s: ReturnType<typeof initServer>,
) => {
  return s.router(contract, {
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
          const signatures = await issuePrescription(body);
          const prescription = await createPrescription(body, signatures);

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
        const prescriptions = await listPrescriptions();

        return {
          status: 200,
          body: {
            prescriptions,
            total: prescriptions.length,
          },
        };
      },

      getById: async ({ params }) => {
        const prescription = await getPrescriptionById(params.id);

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
          await handleWebhookEvent(body);

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
};
