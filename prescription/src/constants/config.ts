export const GLOBAL_CONFIG = {
  isMock: process.env.SIGNATURERX_MOCK === "true",
  clientId: process.env.SIGNATURERX_CLIENT_ID || "",
  clientSecret: process.env.SIGNATURERX_CLIENT_SECRET || "",
  signatureRxBaseUrl: process.env.SIGNATURERX_BASE_URL || "",
  signatureRxWebhookSigningSecret:
    process.env.SIGNATURERX_WEBHOOK_SIGNING_SECRET || "",
};
