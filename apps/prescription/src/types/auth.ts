export interface SignatureRxPrescriptionResponse {
  status: string;
  prescription_id?: string;
  message?: string;
  data?: any;
}

export interface TokenStore {
  access_token: string;
  expires_at: number; // Unix timestamp
}

export interface SignatureRxTokenResponse {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
}
