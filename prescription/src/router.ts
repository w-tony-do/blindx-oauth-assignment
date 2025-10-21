import { contract } from "@contract";
import { initServer } from "@ts-rest/fastify";
import Fastify from "fastify";
import { medications } from "./data/medications";
import {
  createPrescription,
  getPrescriptionById,
  issuePrescription,
  listPrescriptions,
} from "./services/prescription.service";
import {
  checkSumPayload,
  handleWebhookEvent,
} from "./services/webhook.service";

export const router = (
  app: ReturnType<typeof Fastify>,
  s: ReturnType<typeof initServer>,
) => {
  return s.router(contract, {
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
    prescriptions: {
      create: async ({ body }) => {
        try {
          const apiResponse = await issuePrescription(body);
          const signatureRxResponse = {
            prescription_id: apiResponse.prescription_id,
          };
          const prescription = await createPrescription(
            body,
            signatureRxResponse,
          );
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
        } catch (error: unknown) {
          app.log.error("Failed to create prescription:", error);

          if (error instanceof Error && error.message?.includes("401")) {
            return {
              status: 401,
              body: { error: "Authentication failed with SignatureRx" },
            };
          }
          return {
            status: 500,
            body: {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create prescription",
            },
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
        try {
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
        } catch (error: unknown) {
          app.log.error("Failed to get prescription:", error);
          return {
            status: 404,
            body: { error: "Prescription not found" },
          };
        }
      },
    },
    webhooks: {
      signaturerx: async ({ body, headers }) => {
        try {
          const signature = headers["signaturerx-signature"] as string;

          if (!checkSumPayload(signature, body))
            throw new Error("Invalid signature");

          await handleWebhookEvent(body);
          return {
            status: 200,
            body: {
              received: true,
              message: "Webhook event processed successfully",
            },
          };
        } catch (error: unknown) {
          app.log.error("Failed to process webhook:", error);

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to process webhook";
          return {
            status: 400,
            body: { error: errorMessage },
          };
        }
      },
    },
  });
};
