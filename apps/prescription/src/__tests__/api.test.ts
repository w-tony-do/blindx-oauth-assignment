import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import { router } from "../router";
import {
  mockPrescriptionRequest,
  mockSignatureRxResponse,
  mockTokenResponse,
} from "./setup";

describe("API Integration Tests", () => {
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    app = Fastify({
      logger: false,
    });

    await app.register(cors, {
      origin: true,
      credentials: true,
    });

    const s = initServer();
    await app.register(s.plugin(router(app, s)));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Health Check", () => {
    it("should return 200 OK", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("Medications API", () => {
    it("should list all medications", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/medications",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meds).toBeDefined();
      expect(Array.isArray(body.meds)).toBe(true);
      expect(body.total).toBeGreaterThan(0);
    });

    it("should return medications with valid structure", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/medications",
      });

      const body = JSON.parse(response.body);
      const firstMed = body.meds[0];

      expect(firstMed).toHaveProperty("snomedId");
      expect(firstMed).toHaveProperty("displayName");
      expect(firstMed).toHaveProperty("type");
    });
  });

  describe("Prescriptions API", () => {
    describe("POST /prescriptions", () => {
      it("should create a prescription successfully", async () => {
        // Mock SignatureRx API calls
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockTokenResponse,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSignatureRxResponse,
          } as Response);

        const response = await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: mockPrescriptionRequest,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.id).toBeDefined();
        expect(body.status).toBe("Sent");
        expect(body.prescription_id).toBe("RX-123456");
        expect(body.created_at).toBeDefined();
      });

      it("should handle authentication failure", async () => {
        // Mock failed auth
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        } as Response);

        const response = await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: mockPrescriptionRequest,
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toContain("Authentication failed");
      });

      it("should validate required fields", async () => {
        const invalidRequest = {
          ...mockPrescriptionRequest,
          patient: {
            ...mockPrescriptionRequest.patient,
            email: "invalid-email",
          },
        };

        const response = await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: invalidRequest,
        });

        expect(response.statusCode).toBe(400);
      });

      it("should handle missing medicines", async () => {
        const requestWithoutMedicines = {
          ...mockPrescriptionRequest,
          medicines: [],
        };

        const response = await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: requestWithoutMedicines,
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe("GET /prescriptions", () => {
      it("should list all prescriptions", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/prescriptions",
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.prescriptions).toBeDefined();
        expect(Array.isArray(body.prescriptions)).toBe(true);
        expect(body.total).toBeDefined();
      });

      it("should return empty list when no prescriptions exist", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/prescriptions",
        });

        const body = JSON.parse(response.body);
        expect(body.prescriptions).toEqual([]);
        expect(body.total).toBe(0);
      });
    });

    describe("GET /prescriptions/:id", () => {
      it("should return 404 for non-existent prescription", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/prescriptions/non-existent-id",
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toBe("Prescription not found");
      });

      it("should retrieve prescription by id", async () => {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockTokenResponse,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSignatureRxResponse,
          } as Response);

        const createResponse = await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: mockPrescriptionRequest,
        });

        const { id } = JSON.parse(createResponse.body);

        // Then retrieve it
        const getResponse = await app.inject({
          method: "GET",
          url: `/prescriptions/${id}`,
        });

        expect(getResponse.statusCode).toBe(200);
        const body = JSON.parse(getResponse.body);
        expect(body.id).toBe(id);
        expect(body.patient_email).toBe(mockPrescriptionRequest.patient.email);
      });
    });
  });

  describe("Webhooks API", () => {
    describe("POST /webhooks/signaturerx", () => {
      it("should process webhook successfully", async () => {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockTokenResponse,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSignatureRxResponse,
          } as Response);

        await app.inject({
          method: "POST",
          url: "/prescriptions",
          payload: mockPrescriptionRequest,
        });

        // Send webhook
        const webhookPayload = {
          event_type: "prescription.status_updated",
          prescription_id: "RX-123456",
          status: "Delivered",
          data: {},
          timestamp: new Date().toISOString(),
        };

        const response = await app.inject({
          method: "POST",
          url: "/webhooks/signaturerx",
          payload: webhookPayload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.received).toBe(true);
        expect(body.message).toBe("Webhook event processed successfully");
      });

      it("should handle invalid webhook payload", async () => {
        const invalidPayload = {
          event_type: "invalid",
        };

        const response = await app.inject({
          method: "POST",
          url: "/webhooks/signaturerx",
          payload: invalidPayload,
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
