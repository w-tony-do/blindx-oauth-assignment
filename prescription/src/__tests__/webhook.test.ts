// Mock database BEFORE importing other modules
const mockPrescriptions = new Map<string, any>();
let prescriptionCounter = 1;

jest.mock("../libs/db/database", () => {
  return {
    $db: () => ({
      deleteFrom: () => ({
        execute: async () => {
          mockPrescriptions.clear();
          return [];
        },
      }),
      selectFrom: () => ({
        selectAll: () => {
          const chainable = {
            execute: async () => Array.from(mockPrescriptions.values()),
            orderBy: (_col: string, _dir: string) => ({
              execute: async () =>
                Array.from(mockPrescriptions.values()).sort(
                  (a: any, b: any) =>
                    b.created_at.getTime() - a.created_at.getTime(),
                ),
            }),
            where: (col: string, _op: string, val: any) => ({
              executeTakeFirst: async () => {
                for (const [id, prescription] of mockPrescriptions.entries()) {
                  if (col === "id" && id === val) {
                    return prescription;
                  }
                  if (
                    col === "signaturerx_prescription_id" &&
                    prescription.signaturerx_prescription_id === val
                  ) {
                    return prescription;
                  }
                }
                return null;
              },
            }),
          };
          return chainable;
        },
      }),
      insertInto: (_table: string) => ({
        values: (values: any) => ({
          returningAll: () => ({
            executeTakeFirstOrThrow: async () => {
              const id = `prescription_${prescriptionCounter++}`;
              const now = new Date();
              const prescription = {
                id,
                ...values,
                created_at: now,
                updated_at: now,
              };
              mockPrescriptions.set(id, prescription);
              return prescription;
            },
          }),
        }),
      }),
      updateTable: (_table: string) => ({
        set: (values: any) => ({
          where: (col: string, _op: string, val: any) => ({
            execute: async () => {
              for (const [_id, prescription] of mockPrescriptions.entries()) {
                if (
                  col === "signaturerx_prescription_id" &&
                  prescription.signaturerx_prescription_id === val
                ) {
                  Object.assign(prescription, values);
                }
              }
              return [];
            },
          }),
        }),
      }),
      destroy: async () => {},
    }),
    createDatabase: () => ({}),
  };
});

import { $db } from "../libs/db/database";
import * as prescriptionService from "../services/prescription.service";
import * as webhookService from "../services/webhook.service";
import {
  mockPrescriptionRequest,
  mockSignatureRxResponse,
  setupTestDatabase,
} from "./setup";

describe("Webhook Service", () => {
  beforeEach(async () => {
    mockPrescriptions.clear();
    prescriptionCounter = 1;
    await setupTestDatabase();
  });

  describe("handleWebhookEvent", () => {
    it("should update prescription status from webhook", async () => {
      // First create a prescription
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      expect(prescription.status).toBe("created");
      expect(prescription.signaturerx_prescription_id).toBe(
        mockSignatureRxResponse.prescription_id,
      );

      // Send webhook event
      const webhookEvent = {
        object: "event",
        type: "prescription.status_updated",
        data: {
          prescription_token: mockSignatureRxResponse.prescription_id!,
          status: "Delivered",
        },
      };

      await webhookService.handleWebhookEvent(webhookEvent);

      // Verify status was updated - query by signaturerx_prescription_id
      const updated = await $db()
        .selectFrom("prescriptions")
        .selectAll()
        .where(
          "signaturerx_prescription_id",
          "=",
          mockSignatureRxResponse.prescription_id!,
        )
        .executeTakeFirst();

      expect(updated).toBeDefined();
      expect(updated?.status).toBe("Delivered");
    });

    it("should handle prescription.created event", async () => {
      const webhookEvent = {
        object: "event",
        type: "prescription.created",
        data: {
          prescription_token: "RX-NEW-123",
          status: "created",
          patient_email: "test@example.com",
        },
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle prescription.cancelled event", async () => {
      const _prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        object: "event",
        type: "prescription.cancelled",
        data: {
          prescription_token: mockSignatureRxResponse.prescription_id!,
          status: "Cancelled",
        },
      };

      await webhookService.handleWebhookEvent(webhookEvent);

      const updated = await $db()
        .selectFrom("prescriptions")
        .selectAll()
        .where(
          "signaturerx_prescription_id",
          "=",
          mockSignatureRxResponse.prescription_id!,
        )
        .executeTakeFirst();

      expect(updated?.status).toBe("Cancelled");
    });

    it("should handle prescription.delivered event", async () => {
      const _prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        object: "event",
        type: "prescription.delivered",
        data: {
          prescription_token: mockSignatureRxResponse.prescription_id!,
          status: "Delivered",
          delivered_at: new Date().toISOString(),
        },
      };

      await webhookService.handleWebhookEvent(webhookEvent);

      const updated = await $db()
        .selectFrom("prescriptions")
        .selectAll()
        .where(
          "signaturerx_prescription_id",
          "=",
          mockSignatureRxResponse.prescription_id!,
        )
        .executeTakeFirst();

      expect(updated?.status).toBe("Delivered");
    });

    it("should not fail for non-existent prescription", async () => {
      const webhookEvent = {
        object: "event",
        type: "prescription.status_updated",
        data: {
          prescription_token: "NON-EXISTENT-ID",
          status: "Delivered",
        },
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle multiple status updates", async () => {
      const _prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const statuses = [
        "Processing",
        "Dispatched",
        "Out for Delivery",
        "Delivered",
      ];

      for (const status of statuses) {
        const webhookEvent = {
          object: "event",
          type: "prescription.status_updated",
          data: {
            prescription_token: mockSignatureRxResponse.prescription_id!,
            status,
          },
        };

        await webhookService.handleWebhookEvent(webhookEvent);

        const updated = await $db()
          .selectFrom("prescriptions")
          .selectAll()
          .where(
            "signaturerx_prescription_id",
            "=",
            mockSignatureRxResponse.prescription_id!,
          )
          .executeTakeFirst();

        expect(updated?.status).toBe(status);
      }
    });

    it("should handle missing prescription_id gracefully", async () => {
      const invalidWebhook = {
        object: "event",
        type: "prescription.status_updated",
        data: {
          prescription_token: "",
          status: "",
        },
      };

      // Should not throw, just not update anything
      await expect(
        webhookService.handleWebhookEvent(invalidWebhook as any),
      ).resolves.not.toThrow();
    });

    it("should log webhook event details", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      const _prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        object: "event",
        type: "prescription.status_updated",
        data: {
          prescription_token: mockSignatureRxResponse.prescription_id!,
          status: "Delivered",
        },
      };

      await webhookService.handleWebhookEvent(webhookEvent);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Webhook Event Types", () => {
    it("should handle different event types correctly", async () => {
      const eventTypes = [
        "prescription.created",
        "prescription.status_updated",
        "prescription.cancelled",
        "prescription.delivered",
        "prescription.failed",
      ];

      for (const eventType of eventTypes) {
        const webhookEvent = {
          object: "event",
          type: eventType,
          data: {
            prescription_token: "RX-TEST-" + Date.now(),
            status: "Processing",
          },
        };

        await expect(
          webhookService.handleWebhookEvent(webhookEvent),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("Webhook Data Validation", () => {
    it("should accept valid timestamp formats", async () => {
      const webhookEvent = {
        object: "event",
        type: "prescription.created",
        data: {
          prescription_token: "RX-123",
          status: "created",
          timestamp: new Date().toISOString(),
        },
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle additional data fields", async () => {
      const _prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        object: "event",
        type: "prescription.status_updated",
        data: {
          prescription_token: mockSignatureRxResponse.prescription_id!,
          status: "Delivered",
          tracking_number: "TRACK123",
          courier: "Royal Mail",
          delivered_at: new Date().toISOString(),
          signature_required: true,
        },
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });
  });
});
