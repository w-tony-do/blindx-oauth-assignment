import type { WebhookEvent } from "@repo/contracts";
import * as prescriptionService from "./prescription.service";

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  console.log(
    `📥 Received webhook event: ${event.type} for prescription: ${event.data.prescription_token}`,
  );
  console.log(event);

  if (event.data.prescription_token && event.data.status) {
    await prescriptionService.updatePrescriptionStatus(
      event.data.prescription_token as string,
      (event.data.status as string) ?? event.data.order_status,
    );
  }

  console.log(`✅ Webhook event processed successfully`);
}
