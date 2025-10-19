import type {
  CreatePrescriptionRequest,
  StoredPrescription,
} from "@repo/contracts";
import type { Kysely } from "kysely";
import type { Database } from "../db/database.js";
import { SignatureRxService } from "./signaturerx.service.js";

export class PrescriptionService {
  constructor(
    private db: Kysely<Database>,
    private signatureRxService: SignatureRxService,
  ) {}

  /**
   * Create and issue a prescription
   */
  async createPrescription(
    request: CreatePrescriptionRequest,
  ): Promise<StoredPrescription> {
    // Issue prescription to SignatureRx
    const signatureRxResponse =
      await this.signatureRxService.issuePrescription(request);

    // Store in database
    const prescription = await this.db
      .insertInto("prescriptions")
      .values({
        signaturerx_prescription_id:
          signatureRxResponse.prescription_id || null,
        patient_email: request.patient.email,
        patient_name: `${request.patient.first_name} ${request.patient.last_name}`,
        status: signatureRxResponse.status || "Sent",
        medicines: JSON.stringify(request.medicines),
        payload: JSON.stringify(request),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToStoredPrescription(prescription);
  }

  /**
   * List all prescriptions
   */
  async listPrescriptions(): Promise<StoredPrescription[]> {
    const prescriptions = await this.db
      .selectFrom("prescriptions")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    return prescriptions.map(this.mapToStoredPrescription);
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(id: string): Promise<StoredPrescription | null> {
    const prescription = await this.db
      .selectFrom("prescriptions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!prescription) {
      return null;
    }

    return this.mapToStoredPrescription(prescription);
  }

  /**
   * Update prescription status (typically called by webhook handler)
   */
  async updatePrescriptionStatus(
    signaturerxPrescriptionId: string,
    status: string,
  ): Promise<void> {
    await this.db
      .updateTable("prescriptions")
      .set({
        status,
        updated_at: new Date(),
      })
      .where("signaturerx_prescription_id", "=", signaturerxPrescriptionId)
      .execute();

    console.log(
      `✅ Updated prescription ${signaturerxPrescriptionId} status to: ${status}`,
    );
  }

  /**
   * Map database row to StoredPrescription
   */
  private mapToStoredPrescription(row: any): StoredPrescription {
    return {
      id: row.id,
      signaturerx_prescription_id: row.signaturerx_prescription_id,
      patient_email: row.patient_email,
      patient_name: row.patient_name,
      status: row.status,
      medicines:
        typeof row.medicines === "string"
          ? row.medicines
          : JSON.stringify(row.medicines),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
