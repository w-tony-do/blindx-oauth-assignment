import type { CreatePrescriptionRequest, StoredPrescription } from "@contract";
import type { PrescriptionsTable } from "../libs/db/database";
import { $db } from "../libs/db/database";
import {
  SignatureRxPrescriptionResponse,
  SignatureRxApiResponse,
} from "../types/auth";
import * as signatureRxService from "./signaturerx.service";
import { mockPrescription } from "../helpers/mock-api";

function mapToStoredPrescription(row: PrescriptionsTable): StoredPrescription {
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

export async function createPrescription(
  request: CreatePrescriptionRequest,
  signatures: SignatureRxPrescriptionResponse,
): Promise<StoredPrescription> {
  const prescription = await $db()
    .insertInto("prescriptions")
    .values({
      signaturerx_prescription_id: signatures.prescription_id || null,
      patient_email: request.patient.email,
      patient_name: `${request.patient.first_name} ${request.patient.last_name}`,
      status: "created",
      medicines: JSON.stringify(request.medicines),
      payload: JSON.stringify(request),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return mapToStoredPrescription(prescription);
}

export async function listPrescriptions(): Promise<StoredPrescription[]> {
  const prescriptions = await $db()
    .selectFrom("prescriptions")
    .selectAll()
    .orderBy("created_at", "desc")
    .execute();

  return prescriptions.map(mapToStoredPrescription);
}

export async function getPrescriptionById(
  id: string,
): Promise<StoredPrescription | null> {
  const prescription = await $db()
    .selectFrom("prescriptions")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!prescription) {
    return null;
  }

  return mapToStoredPrescription(prescription);
}

export async function updatePrescriptionStatus(
  signaturerxPrescriptionId: string,
  status: string,
): Promise<void> {
  await $db()
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

export async function issuePrescription(
  payload: CreatePrescriptionRequest,
  retryOnExpiry = true,
): Promise<SignatureRxApiResponse> {
  const accessToken = await signatureRxService.getAccessToken();
  const { signatureRxBaseUrl, isMock } = signatureRxService.getConfig();
  if (isMock) {
    return mockPrescription() as SignatureRxApiResponse;
  }

  const url = `${signatureRxBaseUrl}/api/v1/ehr-prescription-patient`;

  console.log(
    `📤 Issuing prescription to SignatureRx for patient: ${payload.patient.email}`,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  // Handle token expiry
  if (response.status === 401 && retryOnExpiry) {
    console.log("🔄 Token expired mid-request, refreshing and retrying...");
    await signatureRxService.resetTokenStore(); // Force token refresh
    return issuePrescription(payload, false); // Retry once
  }

  const responseData = (await response.json()) as SignatureRxApiResponse;

  if (!response.ok) {
    console.error("❌ Prescription issue failed:", responseData);
    throw new Error(
      `Failed to issue prescription: ${response.status} ${JSON.stringify(responseData)}`,
    );
  }

  console.log("✅ Prescription issued successfully:", responseData);
  return responseData;
}
