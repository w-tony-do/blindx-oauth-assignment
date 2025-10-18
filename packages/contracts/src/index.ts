import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
const MedicineSchema = z.object({
  snomedId: z.string(),
  displayName: z.string(),
  unlicensed: z.boolean(),
  endorsements: z.record(z.unknown()),
  prescribeByBrandOnly: z.boolean(),
  type: z.string(),
  bnfExactMatch: z.string().nullable(),
  bnfMatches: z.string().nullable(),
  applianceTypes: z.array(z.unknown()),
  price: z.number().optional(),
});

const PrescriptionMedicineSchema = z.object({
  object: z.literal('medicine'),
  id: z.number(),
  VPID: z.string(),
  APID: z.string().optional(),
  VPPID: z.string().optional(),
  APPID: z.string().optional(),
  description: z.string(),
  qty: z.string(),
  directions: z.string(),
});

const DeliveryAddressSchema = z.object({
  address_ln1: z.string(),
  address_ln2: z.string().optional().default(''),
  city: z.string(),
  post_code: z.string(),
  country: z.string(),
});

const PatientSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email(),
  phone: z.string(),
  birth_day: z.string(),
  birth_month: z.string(),
  birth_year: z.string(),
  address_ln1: z.string(),
  address_ln2: z.string().optional().default(''),
  city: z.string(),
  post_code: z.string(),
  country: z.string(),
  client_ref_id: z.string().optional(),
});

const CreatePrescriptionRequestSchema = z.object({
  action: z.literal('issueForDelivery'),
  contact_id: z.number().optional().default(0),
  clinic_id: z.number(),
  aff_tag: z.string().optional(),
  secure_pin: z.string(),
  notify: z.boolean().default(true),
  send_sms: z.boolean().default(true),
  invoice_clinic: z.boolean().default(false),
  delivery_address: DeliveryAddressSchema,
  prescription_id: z.string().optional().default(''),
  patient: PatientSchema,
  notes: z.string().optional().default(''),
  client_ref_id: z.string().optional().default(''),
  medicines: z.array(PrescriptionMedicineSchema),
  prescriber_ip: z.string().optional(),
});

const PrescriptionResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  prescription_id: z.string().optional(),
  message: z.string().optional(),
  created_at: z.string(),
});

const WebhookEventSchema = z.object({
  event_type: z.string(),
  prescription_id: z.string(),
  status: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string(),
});

const StoredPrescriptionSchema = z.object({
  id: z.string(),
  signaturerx_prescription_id: z.string().nullable(),
  patient_email: z.string(),
  patient_name: z.string(),
  status: z.string(),
  medicines: z.string(), // JSON string
  created_at: z.string(),
  updated_at: z.string(),
});

export const contract = c.router({
  // Medications endpoints
  medications: {
    list: {
      method: 'GET',
      path: '/api/medications',
      responses: {
        200: z.object({
          meds: z.array(MedicineSchema),
          total: z.number(),
        }),
      },
      summary: 'List available medications',
    },
  },
  
  // Prescriptions endpoints
  prescriptions: {
    create: {
      method: 'POST',
      path: '/api/prescriptions/issue',
      body: CreatePrescriptionRequestSchema,
      responses: {
        200: PrescriptionResponseSchema,
        400: z.object({ error: z.string() }),
        401: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
      summary: 'Issue a prescription for delivery',
    },
    
    list: {
      method: 'GET',
      path: '/api/prescriptions',
      responses: {
        200: z.object({
          prescriptions: z.array(StoredPrescriptionSchema),
          total: z.number(),
        }),
      },
      summary: 'List all prescriptions',
    },
    
    getById: {
      method: 'GET',
      path: '/api/prescriptions/:id',
      pathParams: z.object({
        id: z.string(),
      }),
      responses: {
        200: StoredPrescriptionSchema,
        404: z.object({ error: z.string() }),
      },
      summary: 'Get prescription by ID',
    },
  },
  
  // Webhooks endpoint
  webhooks: {
    signaturerx: {
      method: 'POST',
      path: '/api/webhooks/signaturerx',
      body: WebhookEventSchema,
      responses: {
        200: z.object({ 
          received: z.boolean(),
          message: z.string(),
        }),
        400: z.object({ error: z.string() }),
      },
      summary: 'Receive SignatureRx webhook events',
    },
  },
  
  // Health check
  health: {
    check: {
      method: 'GET',
      path: '/api/health',
      responses: {
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
        }),
      },
      summary: 'Health check endpoint',
    },
  },
});

export type Contract = typeof contract;
export type Medicine = z.infer<typeof MedicineSchema>;
export type PrescriptionMedicine = z.infer<typeof PrescriptionMedicineSchema>;
export type CreatePrescriptionRequest = z.infer<typeof CreatePrescriptionRequestSchema>;
export type PrescriptionResponse = z.infer<typeof PrescriptionResponseSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type StoredPrescription = z.infer<typeof StoredPrescriptionSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>;
