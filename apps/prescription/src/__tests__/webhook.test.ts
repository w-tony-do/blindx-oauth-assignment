import { beforeEach, describe, expect, it } from "vitest";
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
    await setupTestDatabase();
  });

  describe("handleWebhookEvent", () => {
    it("should update prescription status from webhook", async () => {
      // First create a prescription
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      expect(prescription.status).toBe("Sent");
      expect(prescription.signaturerx_prescription_id).toBe(
        mockSignatureRxResponse.prescription_id,
      );

      // Send webhook event
      const webhookEvent = {
        event_type: "prescription.status_updated",
        prescription_id: mockSignatureRxResponse.prescription_id!,
        status: "Delivered",
        data: {},
        timestamp: new Date().toISOString(),
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
        event_type: "prescription.created",
        prescription_id: "RX-NEW-123",
        status: "Sent",
        data: {
          patient_email: "test@example.com",
        },
        timestamp: new Date().toISOString(),
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle prescription.cancelled event", async () => {
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        event_type: "prescription.cancelled",
        prescription_id: mockSignatureRxResponse.prescription_id!,
        status: "Cancelled",
        data: {},
        timestamp: new Date().toISOString(),
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
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        event_type: "prescription.delivered",
        prescription_id: mockSignatureRxResponse.prescription_id!,
        status: "Delivered",
        data: {
          delivered_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
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
        event_type: "prescription.status_updated",
        prescription_id: "NON-EXISTENT-ID",
        status: "Delivered",
        data: {},
        timestamp: new Date().toISOString(),
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle multiple status updates", async () => {
      const prescription = await prescriptionService.createPrescription(
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
          event_type: "prescription.status_updated",
          prescription_id: mockSignatureRxResponse.prescription_id!,
          status,
          data: {},
          timestamp: new Date().toISOString(),
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
        event_type: "prescription.status_updated",
        prescription_id: "",
        status: "",
        data: {},
        timestamp: new Date().toISOString(),
      };

      // Should not throw, just not update anything
      await expect(
        webhookService.handleWebhookEvent(invalidWebhook as any),
      ).resolves.not.toThrow();
    });

    it("should log webhook event details", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        event_type: "prescription.status_updated",
        prescription_id: mockSignatureRxResponse.prescription_id!,
        status: "Delivered",
        data: {},
        timestamp: new Date().toISOString(),
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
          event_type: eventType,
          prescription_id: "RX-TEST-" + Date.now(),
          status: "Processing",
          data: {},
          timestamp: new Date().toISOString(),
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
        event_type: "prescription.created",
        prescription_id: "RX-123",
        status: "Sent",
        data: {},
        timestamp: new Date().toISOString(),
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });

    it("should handle additional data fields", async () => {
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const webhookEvent = {
        event_type: "prescription.status_updated",
        prescription_id: mockSignatureRxResponse.prescription_id!,
        status: "Delivered",
        data: {
          tracking_number: "TRACK123",
          courier: "Royal Mail",
          delivered_at: new Date().toISOString(),
          signature_required: true,
        },
        timestamp: new Date().toISOString(),
      };

      await expect(
        webhookService.handleWebhookEvent(webhookEvent),
      ).resolves.not.toThrow();
    });
  });
});
