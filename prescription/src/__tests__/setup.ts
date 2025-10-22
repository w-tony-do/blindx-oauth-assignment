import { config } from "dotenv";
import RedisMock from "ioredis-mock";

// Load environment variables from .env file
config();

// Setup test environment variables
process.env.SIGNATURERX_CLIENT_ID = "test_client_id";
process.env.SIGNATURERX_CLIENT_SECRET = "test_client_secret";
process.env.SIGNATURERX_TOKEN_URL = "https://test.api.com/oauth/token";
process.env.SIGNATURERX_API_URL = "https://test.api.com/api";
process.env.SIGNATURERX_BASE_URL = "https://test.api.com";
process.env.SIGNATURERX_MOCK = "false";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock Redis client
export const mockRedisClient = new RedisMock();

// Mock the redis module
jest.mock("../libs/redis", () => ({
  redisClient: mockRedisClient,
  REDIS_KEYS: {
    SIGNATURERX_TOKEN: "signaturerx:token",
  },
}));

// Setup Redis for tests
export async function setupTestRedis() {
  await mockRedisClient.flushdb();
}

// Cleanup Redis
export async function cleanupTestRedis() {
  await mockRedisClient.flushdb();
}

// Test database setup
export async function setupTestDatabase() {
  // Database mock is handled in individual test files
}

// Clean up test data
export async function cleanupTestDatabase() {
  // Database mock is handled in individual test files
}

// Global test hooks
beforeAll(async () => {
  await setupTestRedis();
});

beforeEach(async () => {
  await setupTestDatabase();
  await setupTestRedis();
  // Don't call jest.clearAllMocks() as it clears mock implementations
});

afterAll(async () => {
  await cleanupTestDatabase();
  await cleanupTestRedis();
  mockRedisClient.disconnect();
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
  contact_id: 0,
  clinic_id: 842,
  secure_pin: "1234",
  notify: true,
  send_sms: true,
  invoice_clinic: false,
  delivery_address: mockDeliveryAddress,
  prescription_id: "",
  patient: mockPatient,
  notes: "",
  client_ref_id: "",
  medicines: [mockMedicine],
  integration_code: "test_integration",
};

export const mockSignatureRxResponse = {
  prescription_id: "RX-123456",
};

export const mockTokenResponse = {
  access_token: "test_access_token_123",
  refresh_token: "test_refresh_token_456",
  expires_in: 3600,
  token_type: "Bearer",
};
