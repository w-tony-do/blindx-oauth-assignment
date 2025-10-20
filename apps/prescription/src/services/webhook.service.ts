import type { WebhookEvent } from "@repo/contracts";
import * as prescriptionService from "./prescription.service";

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  console.log(
    `📥 Received webhook event: ${event.event_type} for prescription: ${event.prescription_id}`,
  );
  console.log(event);

  if (event.prescription_id && event.status) {
    await prescriptionService.updatePrescriptionStatus(
      event.prescription_id,
      event.status,
    );
  }

  console.log(`✅ Webhook event processed successfully`);
}
