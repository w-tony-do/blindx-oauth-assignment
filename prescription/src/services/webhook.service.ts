import type { WebhookEvent } from "@contract";
import crypto from "crypto";
import * as prescriptionService from "./prescription.service";
import { GLOBAL_CONFIG } from "../constants/config";

export const checkSumPayload = (signature: string, event: WebhookEvent) => {
  const { signatureRxWebhookSigningSecret } = GLOBAL_CONFIG;
  const hmac = crypto.createHmac("sha256", signatureRxWebhookSigningSecret);
  hmac.write(JSON.stringify(event)); // write in to the stream
  hmac.end(); // can't read from the stream until you call end()

  const hash = hmac.read().toString("hex"); // read out hmac digest
  console.log("Received Hash: ", signature);
  console.log("Calculated Hash: ", hash);

  return hash === signature;
};

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
