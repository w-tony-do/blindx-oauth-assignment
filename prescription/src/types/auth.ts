// Response from SignatureRx API when issuing a prescription
export interface SignatureRxApiResponse {
  action: string;
  contact_id: number;
  aff_tag: string;
  secure_pin: string;
  integration_code: string;
  notify: boolean;
  send_sms: boolean;
  invoice_clinic: boolean;
  delivery_address: {
    address_ln1: string;
    address_ln2: string;
    city: string;
    post_code: string;
    country: string;
  };
  prescription_id: string;
  patient: {
    first_name: string;
    last_name: string;
    gender: string;
    email: string;
    phone: string;
    birth_day: string;
    birth_month: string;
    birth_year: string;
    address_ln1: string;
    address_ln2: string;
    city: string;
    post_code: string;
    country: string;
    client_ref_id: string;
    appointment_id: string;
    site: string;
    location_id: string;
    nhs_number: string;
  };
  notes: string;
  client_ref_id: string;
  medicines: Array<{
    object: string;
    id: number;
    VPID: string;
    APID: string;
    VPPID: string;
    APPID: string;
    description: string;
    qty: string;
    directions: string;
  }>;
  prescriber_ip: string;
}

// Simplified response type for storing prescription data
export interface SignatureRxPrescriptionResponse {
  prescription_id?: string | null;
  status?: string;
  message?: string;
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
