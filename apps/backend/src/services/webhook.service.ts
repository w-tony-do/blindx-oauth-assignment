import type { WebhookEvent } from "@repo/contracts";
import type { Kysely } from "kysely";
import type { Database } from "../db/database.js";
import { PrescriptionService } from "./prescription.service.js";

export class WebhookService {
  constructor(
    private db: Kysely<Database>,
    private prescriptionService: PrescriptionService,
  ) {}

  /**
   * Handle incoming webhook event from SignatureRx
   */
  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    console.log(
      `📥 Received webhook event: ${event.event_type} for prescription: ${event.prescription_id}`,
    );

    // Store webhook event in database
    await this.db
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
      await this.prescriptionService.updatePrescriptionStatus(
        event.prescription_id,
        event.status,
      );
    }

    console.log(`✅ Webhook event processed successfully`);
  }

  /**
   * Get webhook events for a prescription
   */
  async getWebhookEvents(prescriptionId: string): Promise<any[]> {
    const events = await this.db
      .selectFrom("webhook_events")
      .selectAll()
      .where("prescription_id", "=", prescriptionId)
      .orderBy("received_at", "desc")
      .execute();

    return events;
  }
}
