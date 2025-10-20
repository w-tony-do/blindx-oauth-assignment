import { SignatureRxTokenResponse, TokenStore } from "../types/auth";
import { redisClient, REDIS_KEYS } from "../libs/redis";

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

/**
 * Get token from Redis
 */
async function getTokenFromRedis(): Promise<TokenStore | null> {
  try {
    const tokenJson = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
    if (!tokenJson) {
      return null;
    }
    return JSON.parse(tokenJson) as TokenStore;
  } catch (error) {
    console.error("❌ Failed to get token from Redis:", error);
    return null;
  }
}

/**
 * Save token to Redis
 */
async function saveTokenToRedis(tokenStore: TokenStore): Promise<void> {
  try {
    const ttl = Math.max(
      Math.floor((tokenStore.expires_at - Date.now()) / 1000),
      0,
    );
    await redisClient.setex(
      REDIS_KEYS.SIGNATURERX_TOKEN,
      ttl,
      JSON.stringify(tokenStore),
    );
  } catch (error) {
    console.error("❌ Failed to save token to Redis:", error);
    throw error;
  }
}

/**
 * Delete token from Redis
 */
async function deleteTokenFromRedis(): Promise<void> {
  try {
    await redisClient.del(REDIS_KEYS.SIGNATURERX_TOKEN);
  } catch (error) {
    console.error("❌ Failed to delete token from Redis:", error);
  }
}

export async function resetTokenStore(): Promise<void> {
  await deleteTokenFromRedis();
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

  const tokenStore: TokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
  };

  await saveTokenToRedis(tokenStore);

  console.log(
    `✅ Token fetched successfully, expires in ${data.expires_in} seconds`,
  );
}

async function refreshAccessToken(): Promise<void> {
  const tokenStore = await getTokenFromRedis();

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

  const newTokenStore: TokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000,
  };

  await saveTokenToRedis(newTokenStore);

  console.log("✅ Token refreshed successfully");
}

export async function getAccessToken(): Promise<string> {
  const tokenStore = await getTokenFromRedis();

  if (tokenStore && tokenStore.expires_at > Date.now()) {
    console.log("✅ Using cached access token from Redis");
    return tokenStore.access_token;
  }

  if (tokenStore?.refresh_token) {
    console.log("🔄 Refreshing access token...");
    try {
      await refreshAccessToken();
      const refreshedToken = await getTokenFromRedis();
      return refreshedToken!.access_token;
    } catch (error) {
      console.error("❌ Token refresh failed, fetching new token");
      // Fall through to get new token
    }
  }

  // Get new token
  console.log("🔑 Fetching new access token...");
  await fetchNewToken();
  const newToken = await getTokenFromRedis();
  return newToken!.access_token;
}

export async function getTokenStatus(): Promise<{
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
}> {
  const tokenStore = await getTokenFromRedis();

  if (!tokenStore) {
    return { hasToken: false, expiresAt: null, isExpired: true };
  }

  return {
    hasToken: true,
    expiresAt: new Date(tokenStore.expires_at).toISOString(),
    isExpired: tokenStore.expires_at <= Date.now(),
  };
}
