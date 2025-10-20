import { TokenStore, SignatureRxTokenResponse } from "../types/auth.js";

export function getConfig() {
  const clientId = process.env.SIGNATURERX_CLIENT_ID || "";
  const clientSecret = process.env.SIGNATURERX_CLIENT_SECRET || "";
  const tokenUrl =
    process.env.SIGNATURERX_TOKEN_URL ||
    "https://app.signaturerx.co.uk/oauth/token";
  const apiUrl =
    process.env.SIGNATURERX_API_URL || "https://app.signaturerx.co.uk/api";

  return { clientId, clientSecret, tokenUrl, apiUrl };
}

export function resetTokenStore(): void {
  tokenStore = null;
}

async function fetchNewToken(): Promise<void> {
  const { clientId, clientSecret, tokenUrl } = getConfig();

  if (!clientId || !clientSecret) {
    console.warn(
      "⚠️  SignatureRx credentials not configured. Please set SIGNATURERX_CLIENT_ID and SIGNATURERX_CLIENT_SECRET",
    );
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
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

  tokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
  };

  console.log(
    `✅ Token fetched successfully, expires in ${data.expires_in} seconds`,
  );
}

async function refreshAccessToken(): Promise<void> {
  if (!tokenStore?.refresh_token) {
    throw new Error("No refresh token available");
  }

  const { clientId, clientSecret, tokenUrl } = getConfig();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenStore.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
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

  tokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000,
  };

  console.log("✅ Token refreshed successfully");
}

export async function getAccessToken(): Promise<string> {
  if (tokenStore && tokenStore.expires_at > Date.now()) {
    console.log("✅ Using cached access token");
    return tokenStore.access_token;
  }

  if (tokenStore?.refresh_token) {
    console.log("🔄 Refreshing access token...");
    try {
      await refreshAccessToken();
      return tokenStore!.access_token;
    } catch (error) {
      console.error("❌ Token refresh failed, fetching new token");
      // Fall through to get new token
    }
  }

  // Get new token
  console.log("🔑 Fetching new access token...");
  await fetchNewToken();
  return tokenStore!.access_token;
}

export function getTokenStatus(): {
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
} {
  if (!tokenStore) {
    return { hasToken: false, expiresAt: null, isExpired: true };
  }

  return {
    hasToken: true,
    expiresAt: new Date(tokenStore.expires_at).toISOString(),
    isExpired: tokenStore.expires_at <= Date.now(),
  };
}
