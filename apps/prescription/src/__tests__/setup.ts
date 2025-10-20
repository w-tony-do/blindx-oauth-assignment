import { afterAll, beforeAll, beforeEach } from "vitest";
import { redisClient } from "../libs/redis";
import { $db } from "../db/database";

// Setup test environment variables
process.env.SIGNATURERX_CLIENT_ID = "test_client_id";
process.env.SIGNATURERX_CLIENT_SECRET = "test_client_secret";
process.env.SIGNATURERX_TOKEN_URL = "https://test.api.com/oauth/token";
process.env.SIGNATURERX_API_URL = "https://test.api.com/api";

// Test database setup
export async function setupTestDatabase() {
  // Clean up test data before each test
  await $db().deleteFrom("prescriptions").execute();
}

// Clean up test data
export async function cleanupTestDatabase() {
  await $db().deleteFrom("prescriptions").execute();
}

// Setup Redis for tests
export async function setupTestRedis() {
  await redisClient.flushdb();
}

// Cleanup Redis
export async function cleanupTestRedis() {
  await redisClient.flushdb();
}

// Global test hooks
beforeAll(async () => {
  await setupTestRedis();
});

beforeEach(async () => {
  await setupTestDatabase();
  await setupTestRedis();
});

afterAll(async () => {
  await cleanupTestDatabase();
  await cleanupTestRedis();
  await redisClient.quit();
  await $db().destroy();
});

// Mock data helpers
export const mockPatient = {
  first_name: "John",
  last_name: "Doe",
  gender: "male" as const,
  email: "john.doe@example.com",
  phone: "+44 7700 900000",
  birth_day: "15",
  birth_month: "06",
  birth_year: "1990",
  address_ln1: "123 Test Street",
  address_ln2: "Apt 4B",
  city: "London",
  post_code: "SW1A 1AA",
  country: "United Kingdom",
};

export const mockDeliveryAddress = {
  address_ln1: "456 Delivery Lane",
  address_ln2: "Unit 2",
  city: "Manchester",
  post_code: "M1 1AA",
  country: "United Kingdom",
};

export const mockMedicine = {
  object: "medicine" as const,
  id: 1,
  VPID: "12345678",
  description: "Paracetamol 500mg Tablets",
  qty: "100",
  directions: "Take 2 tablets every 4-6 hours as needed",
};

export const mockPrescriptionRequest = {
  action: "issueForDelivery" as const,
  clinic_id: 842,
  secure_pin: "1234",
  notify: true,
  send_sms: true,
  invoice_clinic: false,
  delivery_address: mockDeliveryAddress,
  patient: mockPatient,
  medicines: [mockMedicine],
};

export const mockSignatureRxResponse = {
  status: "Sent",
  prescription_id: "RX-123456",
  message: "Prescription created successfully",
};

export const mockTokenResponse = {
  access_token: "test_access_token_123",
  refresh_token: "test_refresh_token_456",
  expires_in: 3600,
  token_type: "Bearer",
};
