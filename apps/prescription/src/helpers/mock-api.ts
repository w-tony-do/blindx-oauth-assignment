import { createHmac, randomBytes } from "crypto";

/**
 * Generates a JWT access token with 15 days expiration
 * @returns Object containing access_token and expires_in (epoch timestamp)
 */
export const generateJwtToken = () => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 15 * 24 * 60 * 60; // 15 days in seconds
  const expirationTimestamp = now + expiresIn;

  const payload = {
    sub: randomBytes(16).toString("hex"),
    iat: now,
    exp: expirationTimestamp,
    jti: randomBytes(16).toString("hex"),
  };

  const secret = process.env.JWT_SECRET || "mock-secret-key-for-development";

  const base64UrlEncode = (obj: any) => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  return {
    access_token: token,
    expires_in: expirationTimestamp,
    token_type: "bearer",
  };
};

export const mockPrescription = () => ({
  action: "draft",
  contact_id: 0,
  aff_tag: "string",
  secure_pin: "pa$$word",
  integration_code: "pa$$word",
  notify: true,
  send_sms: true,
  invoice_clinic: true,
  delivery_address: {
    address_ln1: "string",
    address_ln2: "string",
    city: "string",
    post_code: "string",
    country: "United Kingdom",
  },
  prescription_id: "SRXC49F3D4F66A7",
  patient: {
    first_name: "string",
    last_name: "string",
    gender: "string",
    email: "string",
    phone: "441234567890",
    birth_day: "10",
    birth_month: "01",
    birth_year: "1990",
    address_ln1: "string",
    address_ln2: "string",
    city: "string",
    post_code: "string",
    country: "string",
    client_ref_id: "string",
    appointment_id: "string",
    site: "string",
    location_id: "string",
    nhs_number: "9434765919",
  },
  notes: "string",
  client_ref_id: "string",
  medicines: [
    {
      object: "medicine",
      id: 0,
      VPID: "string",
      APID: "string",
      VPPID: "string",
      APPID: "string",
      description: "string",
      qty: "string",
      directions: "string",
    },
  ],
  prescriber_ip: "192.168.0.1",
});

export const mockRefreshToken = () => {
  const tokenData = generateJwtToken();
  return {
    access_token: tokenData.access_token,
    token_type: "bearer",
    expires_in: tokenData.expires_in,
  };
};
