import { REDIS_KEYS, redisClient } from "../libs/redis";
import { SignatureRxTokenResponse, TokenStore } from "../types/auth";

export function getConfig() {
  const isMock = process.env.SIGNATURERX_MOCK === "true";
  const clientId = process.env.SIGNATURERX_CLIENT_ID || "";
  const clientSecret = process.env.SIGNATURERX_CLIENT_SECRET || "";
  const signatureRxBaseUrl = process.env.SIGNATURERX_BASE_URL || "";

  return { clientId, clientSecret, signatureRxBaseUrl, isMock };
}

export async function getTokenFromRedis(): Promise<TokenStore | null> {
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

async function saveTokenToRedis(tokenStore: TokenStore): Promise<void> {
  const ttl = Math.max(
    Math.floor((tokenStore.expires_at - Date.now()) / 1000),
    0,
  );
  await redisClient.setex(
    REDIS_KEYS.SIGNATURERX_TOKEN,
    ttl,
    JSON.stringify(tokenStore),
  );
}

async function fetchNewToken(): Promise<SignatureRxTokenResponse> {
  const { clientId, clientSecret, signatureRxBaseUrl } = getConfig();

  if (!clientId || !clientSecret) {
    console.warn(
      "⚠️  SignatureRx credentials not configured. Please set SIGNATURERX_CLIENT_ID and SIGNATURERX_CLIENT_SECRET",
    );
  }

  const response = await fetch(`${signatureRxBaseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Token fetch failed:", error);
    throw new Error(`Failed to fetch token: ${response.status} ${error}`);
  }

  const data = (await response.json()) as SignatureRxTokenResponse;

  const tokenStore: TokenStore = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
  };

  await saveTokenToRedis(tokenStore);

  console.log(
    `✅ Token fetched successfully, expires in ${data.expires_in} seconds`,
  );

  return data;
}

// async function fetchSignatureRxRefreshToken(
//   nearlyExpiredToken: string,
// ): Promise<SignatureRxTokenResponse | null> {
//   const { signatureRxBaseUrl } = getConfig();
//
//   try {
//     const response = await fetch(`${signatureRxBaseUrl}/api/v1/refresh`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         authorization: `Bearer ${nearlyExpiredToken}`,
//       },
//     });
//
//     if (!response.ok) {
//       const error = await response.text();
//       console.error("❌ Token refresh failed:", error);
//       return null;
//     }
//
//     const data = (await response.json()) as SignatureRxTokenResponse;
//
//     const newTokenStore = {
//       access_token: data.access_token,
//       expires_at: Date.now() + data.expires_in * 1000 - 60000,
//     };
//
//     await saveTokenToRedis(newTokenStore);
//
//     console.log("✅ Token refreshed successfully");
//
//     return data;
//   } catch (error) {
//     console.error("❌ Token refresh exception:", error);
//     return null;
//   }
// }

export async function getAccessToken(): Promise<string> {
  const tokenStore = await getTokenFromRedis();

  if (tokenStore) {
    console.log("✅ Using cached access token from Redis");
    return tokenStore.access_token;
  }

  return (await fetchNewToken()).access_token;
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
