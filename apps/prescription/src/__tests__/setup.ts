import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
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
const mockRedisClient = new RedisMock();

// Mock the redis module
vi.mock("../libs/redis", () => ({
  redisClient: mockRedisClient,
  REDIS_KEYS: {
    SIGNATURERX_TOKEN: "signaturerx:token",
  },
}));

// Mock database with in-memory storage
const mockPrescriptions = new Map();
let prescriptionCounter = 1;

const mockDb = {
  deleteFrom: vi.fn(() => ({
    execute: vi.fn(async () => {
      mockPrescriptions.clear();
      return [];
    }),
  })),
  selectFrom: vi.fn(() => ({
    selectAll: vi.fn(() => {
      const chainable = {
        execute: vi.fn(async () => Array.from(mockPrescriptions.values())),
        orderBy: vi.fn(() => ({
          execute: vi.fn(async () =>
            Array.from(mockPrescriptions.values()).sort(
              (a: any, b: any) =>
                b.created_at.getTime() - a.created_at.getTime(),
            ),
          ),
        })),
        where: vi.fn((col: string, op: string, val: any) => ({
          executeTakeFirst: vi.fn(async () => {
            for (const [id, prescription] of mockPrescriptions.entries()) {
              if (col === "id" && id === val) {
                return prescription;
              }
              if (
                col === "signaturerx_prescription_id" &&
                prescription.signaturerx_prescription_id === val
              ) {
                return prescription;
              }
            }
            return null;
          }),
        })),
      };
      return chainable;
    }),
  })),
  insertInto: vi.fn(() => ({
    values: vi.fn((values: any) => ({
      returningAll: vi.fn(() => ({
        executeTakeFirstOrThrow: vi.fn(async () => {
          const id = `prescription_${prescriptionCounter++}`;
          const now = new Date();
          const prescription = {
            id,
            ...values,
            created_at: now,
            updated_at: now,
          };
          mockPrescriptions.set(id, prescription);
          return prescription;
        }),
      })),
    })),
  })),
  updateTable: vi.fn(() => ({
    set: vi.fn((values: any) => ({
      where: vi.fn((col: string, op: string, val: any) => ({
        execute: vi.fn(async () => {
          for (const [id, prescription] of mockPrescriptions.entries()) {
            if (
              col === "signaturerx_prescription_id" &&
              prescription.signaturerx_prescription_id === val
            ) {
              Object.assign(prescription, values);
            }
          }
          return [];
        }),
      })),
    })),
  })),
  destroy: vi.fn(async () => {}),
};

// Mock the database module
vi.mock("../libs/db/database", () => ({
  $db: vi.fn(() => mockDb),
  createDatabase: vi.fn(() => mockDb),
}));

// Test database setup
export async function setupTestDatabase() {
  // Clean up test data before each test
  mockPrescriptions.clear();
  prescriptionCounter = 1;
}

// Clean up test data
export async function cleanupTestDatabase() {
  mockPrescriptions.clear();
  prescriptionCounter = 1;
}

// Setup Redis for tests
export async function setupTestRedis() {
  await mockRedisClient.flushdb();
}

// Cleanup Redis
export async function cleanupTestRedis() {
  await mockRedisClient.flushdb();
}

// Global test hooks
beforeAll(async () => {
  await setupTestRedis();
});

beforeEach(async () => {
  await setupTestDatabase();
  await setupTestRedis();
  vi.clearAllMocks();
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
