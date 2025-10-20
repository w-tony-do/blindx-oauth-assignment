import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as signatureRxService from "../services/signaturerx.service";
import { redisClient, REDIS_KEYS } from "../libs/redis";
import { mockTokenResponse } from "./setup";

describe("SignatureRx Service with Redis", () => {
  beforeEach(async () => {
    await signatureRxService.resetTokenStore();
    await redisClient.flushdb();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Token Management", () => {
    it("should fetch a new token and store in Redis", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const token = await signatureRxService.getAccessToken();

      expect(token).toBe(mockTokenResponse.access_token);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Verify token is stored in Redis
      const storedToken = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
      expect(storedToken).toBeDefined();

      const parsed = JSON.parse(storedToken!);
      expect(parsed.access_token).toBe(mockTokenResponse.access_token);
      expect(parsed.refresh_token).toBe(mockTokenResponse.refresh_token);
    });

    it("should return cached token from Redis if still valid", async () => {
      // Mock first fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      // First call - fetches new token
      const token1 = await signatureRxService.getAccessToken();

      // Second call - should use cached token from Redis
      const token2 = await signatureRxService.getAccessToken();

      expect(token1).toBe(token2);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should refresh token using refresh_token", async () => {
      // First fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await signatureRxService.getAccessToken();

      // Manually expire the token in Redis
      const storedToken = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
      const tokenData = JSON.parse(storedToken!);
      tokenData.expires_at = Date.now() - 1000; // Expired
      await redisClient.set(
        REDIS_KEYS.SIGNATURERX_TOKEN,
        JSON.stringify(tokenData),
      );

      // Mock refresh token response
      const refreshedToken = {
        ...mockTokenResponse,
        access_token: "refreshed_access_token",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => refreshedToken,
      } as Response);

      const newToken = await signatureRxService.getAccessToken();

      expect(newToken).toBe("refreshed_access_token");
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("grant_type=refresh_token"),
        }),
      );
    });

    it("should fetch new token if refresh fails", async () => {
      // First fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await signatureRxService.getAccessToken();

      // Expire the token
      const storedToken = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
      const tokenData = JSON.parse(storedToken!);
      tokenData.expires_at = Date.now() - 1000;
      await redisClient.set(
        REDIS_KEYS.SIGNATURERX_TOKEN,
        JSON.stringify(tokenData),
      );

      // Mock refresh failure and new token fetch
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => "Invalid refresh token",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockTokenResponse,
            access_token: "new_token_after_refresh_failed",
          }),
        } as Response);

      const token = await signatureRxService.getAccessToken();

      expect(token).toBe("new_token_after_refresh_failed");
      expect(fetch).toHaveBeenCalledTimes(2); // Refresh attempt + new token fetch
    });

    it("should set TTL on Redis token", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await signatureRxService.getAccessToken();

      // Check TTL
      const ttl = await redisClient.ttl(REDIS_KEYS.SIGNATURERX_TOKEN);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600); // Should be around expires_in (3600s) - 60s buffer
    });
  });

  describe("Token Status", () => {
    it("should return hasToken false when no token exists", async () => {
      const status = await signatureRxService.getTokenStatus();

      expect(status.hasToken).toBe(false);
      expect(status.expiresAt).toBe(null);
      expect(status.isExpired).toBe(true);
    });

    it("should return correct status when token exists", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await signatureRxService.getAccessToken();

      const status = await signatureRxService.getTokenStatus();

      expect(status.hasToken).toBe(true);
      expect(status.expiresAt).toBeDefined();
      expect(status.isExpired).toBe(false);
    });

    it("should detect expired token", async () => {
      // Store an expired token
      const expiredTokenData = {
        access_token: "expired_token",
        refresh_token: "refresh_token",
        expires_at: Date.now() - 1000,
      };

      await redisClient.set(
        REDIS_KEYS.SIGNATURERX_TOKEN,
        JSON.stringify(expiredTokenData),
      );

      const status = await signatureRxService.getTokenStatus();

      expect(status.hasToken).toBe(true);
      expect(status.isExpired).toBe(true);
    });
  });

  describe("Reset Token Store", () => {
    it("should delete token from Redis", async () => {
      // First store a token
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await signatureRxService.getAccessToken();

      // Verify it exists
      let storedToken = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
      expect(storedToken).toBeDefined();

      // Reset token store
      await signatureRxService.resetTokenStore();

      // Verify it's deleted
      storedToken = await redisClient.get(REDIS_KEYS.SIGNATURERX_TOKEN);
      expect(storedToken).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should throw error when credentials are missing", async () => {
      const originalClientId = process.env.SIGNATURERX_CLIENT_ID;
      delete process.env.SIGNATURERX_CLIENT_ID;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(signatureRxService.getAccessToken()).rejects.toThrow();

      process.env.SIGNATURERX_CLIENT_ID = originalClientId;
    });

    it("should handle fetch errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      await expect(signatureRxService.getAccessToken()).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle Redis connection errors", async () => {
      // Simulate Redis error by closing connection temporarily
      const originalGet = redisClient.get;
      redisClient.get = vi.fn().mockRejectedValueOnce(new Error("Redis error"));

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      // Should still fetch token even if Redis read fails
      const token = await signatureRxService.getAccessToken();
      expect(token).toBeDefined();

      redisClient.get = originalGet;
    });
  });

  describe("Config", () => {
    it("should return correct configuration", () => {
      const config = signatureRxService.getConfig();

      expect(config).toHaveProperty("clientId");
      expect(config).toHaveProperty("clientSecret");
      expect(config).toHaveProperty("tokenUrl");
    });

    it("should use environment variables", () => {
      process.env.SIGNATURERX_CLIENT_ID = "test_client_id";
      process.env.SIGNATURERX_CLIENT_SECRET = "test_secret";

      const config = signatureRxService.getConfig();

      expect(config.clientId).toBe("test_client_id");
      expect(config.clientSecret).toBe("test_secret");
    });
  });
});
