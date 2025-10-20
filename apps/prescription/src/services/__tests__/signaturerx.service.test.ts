import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as signatureRxService from '../signaturerx.service';

// Mock environment variables
process.env.SIGNATURERX_CLIENT_ID = 'test_client_id';
process.env.SIGNATURERX_CLIENT_SECRET = 'test_client_secret';
process.env.SIGNATURERX_TOKEN_URL = 'https://test.api.com/oauth/token';
process.env.SIGNATURERX_API_URL = 'https://test.api.com/api';

describe('SignatureRxService', () => {
  beforeEach(() => {
    signatureRxService.resetTokenStore();
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should fetch a new token when no token exists', async () => {
      const mockToken = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as Response);

      const token = await signatureRxService.getAccessToken();

      expect(token).toBe('test_access_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://test.api.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return cached token if still valid', async () => {
      const mockToken = {
        access_token: 'cached_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      } as Response);

      // First call - fetches new token
      const token1 = await signatureRxService.getAccessToken();
      
      // Second call - should use cached token
      const token2 = await signatureRxService.getAccessToken();

      expect(token1).toBe(token2);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('getTokenStatus', () => {
    it('should return hasToken false when no token exists', () => {
      const status = signatureRxService.getTokenStatus();

      expect(status.hasToken).toBe(false);
      expect(status.expiresAt).toBe(null);
      expect(status.isExpired).toBe(true);
    });
  });
});
