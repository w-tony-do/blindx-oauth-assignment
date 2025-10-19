import type { WebhookEvent } from "@repo/contracts";
import type { Kysely } from "kysely";
import type { Database } from "../db/database.js";
import * as prescriptionService from "./prescription.service.js";

/**
 * Handle incoming webhook event from SignatureRx
 */
export async function handleWebhookEvent(
  db: Kysely<Database>,
  event: WebhookEvent,
): Promise<void> {
  console.log(
    `📥 Received webhook event: ${event.event_type} for prescription: ${event.prescription_id}`,
  );

  // Store webhook event in database
  await db
    .insertInto("webhook_events")
    .values({
      event_type: event.event_type,
      prescription_id: event.prescription_id,
      status: event.status,
      payload: JSON.stringify(event),
    })
    .execute();

  // Update prescription status if applicable
  if (event.prescription_id && event.status) {
    await prescriptionService.updatePrescriptionStatus(
      db,
      event.prescription_id,
      event.status,
    );
  }

  console.log(`✅ Webhook event processed successfully`);
}

/**
 * Get webhook events for a prescription
 */
export async function getWebhookEvents(
  db: Kysely<Database>,
  prescriptionId: string,
): Promise<any[]> {
  const events = await db
    .selectFrom("webhook_events")
    .selectAll()
    .where("prescription_id", "=", prescriptionId)
    .orderBy("received_at", "desc")
    .execute();

  return events;
}
