// Mock database BEFORE importing services
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

import * as prescriptionService from "../services/prescription.service";
import {
  mockPrescriptionRequest,
  mockSignatureRxResponse,
  mockTokenResponse,
  setupTestDatabase,
} from "./setup";
import { mockPrescription } from "../helpers/mock-api";

let fetchSpy: any;

describe("Prescription Service", () => {
  beforeEach(async () => {
    mockPrescriptions.clear();
    prescriptionCounter = 1;
    await setupTestDatabase();
    // Don't call jest.clearAllMocks() as it clears mock implementations
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe("createPrescription", () => {
    it("should create and store a prescription", async () => {
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      expect(prescription.id).toBeDefined();
      expect(prescription.patient_email).toBe(
        mockPrescriptionRequest.patient.email,
      );
      expect(prescription.patient_name).toBe(
        `${mockPrescriptionRequest.patient.first_name} ${mockPrescriptionRequest.patient.last_name}`,
      );
      expect(prescription.status).toBe("created");
      expect(prescription.signaturerx_prescription_id).toBe(
        mockSignatureRxResponse.prescription_id,
      );
    });

    it("should store medicines as JSON string", async () => {
      const prescription = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      expect(prescription.medicines).toBeDefined();
      expect(typeof prescription.medicines).toBe("string");

      const medicines = JSON.parse(prescription.medicines);
      expect(Array.isArray(medicines)).toBe(true);
      expect(medicines).toHaveLength(mockPrescriptionRequest.medicines.length);
    });
  });

  describe("listPrescriptions", () => {
    it("should return empty array when no prescriptions exist", async () => {
      const prescriptions = await prescriptionService.listPrescriptions();

      expect(prescriptions).toEqual([]);
    });

    it("should return all prescriptions", async () => {
      // Create multiple prescriptions
      await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      await prescriptionService.createPrescription(
        {
          ...mockPrescriptionRequest,
          patient: {
            ...mockPrescriptionRequest.patient,
            email: "jane.doe@example.com",
          },
        },
        { ...mockSignatureRxResponse, prescription_id: "RX-789012" },
      );

      const prescriptions = await prescriptionService.listPrescriptions();

      expect(prescriptions).toHaveLength(2);
      expect(prescriptions[0]?.created_at).toBeDefined();
      expect(prescriptions[1]?.created_at).toBeDefined();
    });

    it("should return prescriptions ordered by created_at desc", async () => {
      // Create prescriptions with delay to ensure different timestamps
      const first = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await prescriptionService.createPrescription(
        {
          ...mockPrescriptionRequest,
          patient: {
            ...mockPrescriptionRequest.patient,
            email: "jane.doe@example.com",
          },
        },
        { ...mockSignatureRxResponse, prescription_id: "RX-789012" },
      );

      const prescriptions = await prescriptionService.listPrescriptions();

      expect(prescriptions[0]?.id).toBe(second.id);
      expect(prescriptions[1]?.id).toBe(first.id);
    });
  });

  describe("getPrescriptionById", () => {
    it("should return null for non-existent prescription", async () => {
      // Use a valid UUID format for the test
      const prescription = await prescriptionService.getPrescriptionById(
        "00000000-0000-0000-0000-000000000000",
      );

      expect(prescription).toBeNull();
    });

    it("should return prescription by id", async () => {
      const created = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      const retrieved = await prescriptionService.getPrescriptionById(
        created.id,
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.patient_email).toBe(created.patient_email);
    });
  });

  describe("updatePrescriptionStatus", () => {
    it("should update prescription status", async () => {
      const created = await prescriptionService.createPrescription(
        mockPrescriptionRequest,
        mockSignatureRxResponse,
      );

      expect(created.status).toBe("created");

      await prescriptionService.updatePrescriptionStatus(
        mockSignatureRxResponse.prescription_id!,
        "Delivered",
      );

      const updated = await prescriptionService.getPrescriptionById(created.id);

      expect(updated?.status).toBe("Delivered");
    });

    it("should not throw error for non-existent prescription", async () => {
      await expect(
        prescriptionService.updatePrescriptionStatus(
          "non-existent-id",
          "Delivered",
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("issuePrescription", () => {
    it("should successfully issue a prescription", async () => {
      const mockApiResponse = mockPrescription();
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        } as Response);

      const result = await prescriptionService.issuePrescription(
        mockPrescriptionRequest,
      );

      expect(result.prescription_id).toBe("SRXC49F3D4F66A7");
      expect(result.action).toBe("draft");
    });

    it("should throw error on API failure", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Internal server error" }),
        } as Response);

      await expect(
        prescriptionService.issuePrescription(mockPrescriptionRequest),
      ).rejects.toThrow("Failed to issue prescription");
    });

    it("should retry on 401 error", async () => {
      const mockApiResponse = mockPrescription();
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        } as Response);

      const result = await prescriptionService.issuePrescription(
        mockPrescriptionRequest,
      );

      expect(result.prescription_id).toBe("SRXC49F3D4F66A7");
      expect(fetchSpy).toHaveBeenCalledTimes(4); // Initial token + 401 + refresh token + retry
    });

    it("should not retry more than once", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({}),
        } as Response);

      await expect(
        prescriptionService.issuePrescription(mockPrescriptionRequest),
      ).rejects.toThrow();

      // Should not retry indefinitely
      expect(fetchSpy).toHaveBeenCalledTimes(4);
    });

    it("should send correct payload to SignatureRx API", async () => {
      const mockApiResponse = mockPrescription();
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        } as Response);

      await prescriptionService.issuePrescription(mockPrescriptionRequest);

      const prescriptionCall = fetchSpy.mock.calls.find((call: any) =>
        call[0].includes("/ehr-prescription-patient"),
      );

      expect(prescriptionCall).toBeDefined();
      expect(prescriptionCall[1].method).toBe("POST");
      expect(prescriptionCall[1].headers.Authorization).toContain("Bearer");

      const body = JSON.parse(prescriptionCall[1].body);
      expect(body.patient.email).toBe(mockPrescriptionRequest.patient.email);
      expect(body.medicines).toHaveLength(1);
    });
  });
});
