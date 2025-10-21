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

  beforeEach(() => {
    mockPrescriptions.clear();
    prescriptionCounter = 1;
  });

  beforeAll(async () => {
    // Enable mock mode for API tests
    process.env.SIGNATURERX_MOCK = "true";

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
        url: "/api/health",
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
        url: "/api/medications",
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
        url: "/api/medications",
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
        global.fetch = jest
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
          url: "/api/prescriptions/issue",
          payload: mockPrescriptionRequest,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.id).toBeDefined();
        expect(body.status).toBe("created");
        expect(body.prescription_id).toBe("SRXC49F3D4F66A7");
        expect(body.created_at).toBeDefined();
      });

      it("should handle authentication failure", async () => {
        // Temporarily disable mock mode to test auth failure
        const originalMock = process.env.SIGNATURERX_MOCK;
        process.env.SIGNATURERX_MOCK = "false";

        // Mock failed auth
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        } as Response);

        const response = await app.inject({
          method: "POST",
          url: "/api/prescriptions/issue",
          payload: mockPrescriptionRequest,
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toContain("Authentication failed");

        // Restore mock mode
        process.env.SIGNATURERX_MOCK = originalMock;
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
          url: "/api/prescriptions/issue",
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
          url: "/api/prescriptions/issue",
          payload: requestWithoutMedicines,
        });

        // ts-rest validates the schema and returns 400 for invalid requests
        expect(response.statusCode).toBe(400);
      });
    });

    describe("GET /prescriptions", () => {
      it("should list all prescriptions", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/api/prescriptions",
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
          url: "/api/prescriptions",
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
          url: "/api/prescriptions/non-existent-id",
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toBe("Prescription not found");
      });

      it("should retrieve prescription by id", async () => {
        global.fetch = jest
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
          url: "/api/prescriptions/issue",
          payload: mockPrescriptionRequest,
        });

        const { id } = JSON.parse(createResponse.body);

        // Then retrieve it
        const getResponse = await app.inject({
          method: "GET",
          url: `/api/prescriptions/${id}`,
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
        global.fetch = jest
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
          url: "/api/prescriptions/issue",
          payload: mockPrescriptionRequest,
        });

        // Send webhook with correct format
        const webhookPayload = {
          object: "event",
          type: "prescription.status_updated",
          data: {
            prescription_token: "RX-123456",
            status: "Delivered",
          },
        };

        const response = await app.inject({
          method: "POST",
          url: "/api/webhooks/signaturerx",
          payload: webhookPayload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.received).toBe(true);
        expect(body.message).toBe("Webhook event processed successfully");
      });

      it("should handle invalid webhook payload", async () => {
        const invalidPayload = {
          type: "invalid",
        };

        const response = await app.inject({
          method: "POST",
          url: "/api/webhooks/signaturerx",
          payload: invalidPayload,
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
