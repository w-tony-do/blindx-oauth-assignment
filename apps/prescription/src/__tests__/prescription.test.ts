import { describe, it, expect, beforeEach, vi } from "vitest";
import * as prescriptionService from "../services/prescription.service";
import {
  mockPrescriptionRequest,
  mockSignatureRxResponse,
  mockTokenResponse,
  setupTestDatabase,
} from "./setup";

describe("Prescription Service", () => {
  beforeEach(async () => {
    await setupTestDatabase();
    vi.clearAllMocks();
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
      expect(prescriptions[0].created_at).toBeDefined();
      expect(prescriptions[1].created_at).toBeDefined();
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

      expect(prescriptions[0].id).toBe(second.id);
      expect(prescriptions[1].id).toBe(first.id);
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

      const result = await prescriptionService.issuePrescription(
        mockPrescriptionRequest,
      );

      expect(result.status).toBe("Sent");
      expect(result.prescription_id).toBe("RX-123456");
    });

    it("should throw error on API failure", async () => {
      global.fetch = vi
        .fn()
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
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSignatureRxResponse,
        } as Response);

      const result = await prescriptionService.issuePrescription(
        mockPrescriptionRequest,
      );

      expect(result.status).toBe("Sent");
      expect(fetch).toHaveBeenCalledTimes(4); // Initial token + 401 + refresh token + retry
    });

    it("should not retry more than once", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as Response);

      await expect(
        prescriptionService.issuePrescription(mockPrescriptionRequest),
      ).rejects.toThrow();

      // Should not retry indefinitely
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("should send correct payload to SignatureRx API", async () => {
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

      await prescriptionService.issuePrescription(mockPrescriptionRequest);

      const prescriptionCall = (fetch as any).mock.calls.find((call: any) =>
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
