import type { CreatePrescriptionRequest } from "@repo/contracts";

interface TokenStore {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}

interface SignatureRxTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

interface SignatureRxPrescriptionResponse {
  status: string;
  prescription_id?: string;
  message?: string;
  data?: any;
}

export class SignatureRxService {
  private tokenStore: TokenStore | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl: string;
  private readonly apiUrl: string;

  constructor() {
    this.clientId = process.env.SIGNATURERX_CLIENT_ID || "";
    this.clientSecret = process.env.SIGNATURERX_CLIENT_SECRET || "";
    this.tokenUrl =
      process.env.SIGNATURERX_TOKEN_URL ||
      "https://app.signaturerx.co.uk/oauth/token";
    this.apiUrl =
      process.env.SIGNATURERX_API_URL || "https://app.signaturerx.co.uk/api";

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        "⚠️  SignatureRx credentials not configured. Please set SIGNATURERX_CLIENT_ID and SIGNATURERX_CLIENT_SECRET",
      );
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.tokenStore && this.tokenStore.expires_at > Date.now()) {
      console.log("✅ Using cached access token");
      return this.tokenStore.access_token;
    }

    // Check if we can refresh
    if (this.tokenStore?.refresh_token) {
      console.log("🔄 Refreshing access token...");
      try {
        await this.refreshAccessToken();
        return this.tokenStore!.access_token;
      } catch (error) {
        console.error("❌ Token refresh failed, fetching new token");
        // Fall through to get new token
      }
    }

    // Get new token
    console.log("🔑 Fetching new access token...");
    await this.fetchNewToken();
    return this.tokenStore!.access_token;
  }

  /**
   * Fetch a new access token using client credentials
   */
  private async fetchNewToken(): Promise<void> {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Token fetch failed:", error);
      throw new Error(`Failed to fetch token: ${response.status} ${error}`);
    }

    const data: SignatureRxTokenResponse = await response.json();

    this.tokenStore = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
    };

    console.log(
      `✅ Token fetched successfully, expires in ${data.expires_in} seconds`,
    );
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokenStore?.refresh_token) {
      throw new Error("No refresh token available");
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.tokenStore.refresh_token,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data: SignatureRxTokenResponse = await response.json();

    this.tokenStore = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000 - 60000,
    };

    console.log("✅ Token refreshed successfully");
  }

  /**
   * Issue a prescription for delivery
   */
  async issuePrescription(
    payload: CreatePrescriptionRequest,
    retryOnExpiry = true,
  ): Promise<SignatureRxPrescriptionResponse> {
    const accessToken = await this.getAccessToken();

    const url = `${this.apiUrl}/prescriptions`;

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
      this.tokenStore = null; // Force token refresh
      return this.issuePrescription(payload, false); // Retry once
    }

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ Prescription issue failed:", responseData);
      throw new Error(
        `Failed to issue prescription: ${response.status} ${JSON.stringify(responseData)}`,
      );
    }

    console.log("✅ Prescription issued successfully:", responseData);
    return responseData;
  }

  /**
   * Check token status (for debugging)
   */
  getTokenStatus(): {
    hasToken: boolean;
    expiresAt: string | null;
    isExpired: boolean;
  } {
    if (!this.tokenStore) {
      return { hasToken: false, expiresAt: null, isExpired: true };
    }

    return {
      hasToken: true,
      expiresAt: new Date(this.tokenStore.expires_at).toISOString(),
      isExpired: this.tokenStore.expires_at <= Date.now(),
    };
  }
}
