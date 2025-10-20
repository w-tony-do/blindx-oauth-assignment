# API Testing Guide

This document provides examples for testing the SignatureRx integration API endpoints using curl or Postman.

## Base URL

```
http://localhost:3001
```

## Endpoints

### 1. Health Check

Check if the API is running:

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T16:00:00.000Z"
}
```

---

### 2. List Medications

Get available medications for prescription:

```bash
curl http://localhost:3001/api/medications
```

**Response:**
```json
{
  "meds": [
    {
      "snomedId": "13892511000001100",
      "displayName": "Amlodipine 5mg/5ml oral solution",
      "unlicensed": false,
      "endorsements": {},
      "prescribeByBrandOnly": false,
      "type": "vmp",
      "bnfExactMatch": null,
      "bnfMatches": null,
      "applianceTypes": []
    }
  ],
  "total": 13
}
```

---

### 3. Create Prescription

Issue a prescription for delivery:

```bash
curl -X POST http://localhost:3001/api/prescriptions/issue \
  -H "Content-Type: application/json" \
  -d '{
    "action": "issueForDelivery",
    "contact_id": 0,
    "clinic_id": 842,
    "aff_tag": "Test Prescription",
    "secure_pin": "111111",
    "notify": true,
    "send_sms": true,
    "invoice_clinic": false,
    "delivery_address": {
      "address_ln1": "123 High Street",
      "address_ln2": "",
      "city": "London",
      "post_code": "SW1A 1AA",
      "country": "United Kingdom"
    },
    "prescription_id": "",
    "patient": {
      "first_name": "John",
      "last_name": "Doe",
      "gender": "male",
      "email": "john.doe@example.com",
      "phone": "441234567890",
      "birth_day": "15",
      "birth_month": "06",
      "birth_year": "1985",
      "address_ln1": "123 High Street",
      "address_ln2": "",
      "city": "London",
      "post_code": "SW1A 1AA",
      "country": "United Kingdom",
      "client_ref_id": "TEST-001"
    },
    "notes": "",
    "client_ref_id": "",
    "medicines": [
      {
        "object": "medicine",
        "id": 0,
        "VPID": "42089511000001103",
        "APID": "",
        "VPPID": "",
        "APPID": "",
        "description": "Sildenafil 25mg tablets",
        "qty": "10",
        "directions": "Take as directed"
      }
    ],
    "prescriber_ip": "127.0.0.1"
  }'
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Sent",
  "prescription_id": "SRX-12345",
  "created_at": "2025-10-18T16:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "error": "Authentication failed with SignatureRx"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to create prescription: Invalid payload"
}
```

---

### 4. List All Prescriptions

Get all stored prescriptions:

```bash
curl http://localhost:3001/api/prescriptions
```

**Response:**
```json
{
  "prescriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "signaturerx_prescription_id": "SRX-12345",
      "patient_email": "john.doe@example.com",
      "patient_name": "John Doe",
      "status": "Sent",
      "medicines": "[{\"object\":\"medicine\",\"id\":0,\"VPID\":\"42089511000001103\",\"description\":\"Sildenafil 25mg tablets\",\"qty\":\"10\",\"directions\":\"Take as directed\"}]",
      "created_at": "2025-10-18T16:00:00.000Z",
      "updated_at": "2025-10-18T16:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 5. Get Prescription by ID

Get a specific prescription:

```bash
curl http://localhost:3001/api/prescriptions/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "signaturerx_prescription_id": "SRX-12345",
  "patient_email": "john.doe@example.com",
  "patient_name": "John Doe",
  "status": "Sent",
  "medicines": "[{\"object\":\"medicine\",\"id\":0,\"VPID\":\"42089511000001103\",\"description\":\"Sildenafil 25mg tablets\",\"qty\":\"10\",\"directions\":\"Take as directed\"}]",
  "created_at": "2025-10-18T16:00:00.000Z",
  "updated_at": "2025-10-18T16:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Prescription not found"
}
```

---

### 6. Webhook Endpoint (SignatureRx)

Receive webhook events from SignatureRx:

```bash
curl -X POST http://localhost:3001/api/webhooks/signaturerx \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "prescription.status_updated",
    "prescription_id": "SRX-12345",
    "status": "Delivered",
    "data": {
      "tracking_number": "TRACK123",
      "delivery_date": "2025-10-20T10:00:00Z"
    },
    "timestamp": "2025-10-18T18:00:00.000Z"
  }'
```

**Response:**
```json
{
  "received": true,
  "message": "Webhook event processed successfully"
}
```

---

## Postman Collection

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Blinx SignatureRx API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/health",
          "host": ["{{baseUrl}}"],
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "List Medications",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/medications",
          "host": ["{{baseUrl}}"],
          "path": ["api", "medications"]
        }
      }
    },
    {
      "name": "Create Prescription",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"action\": \"issueForDelivery\",\n  \"contact_id\": 0,\n  \"clinic_id\": 842,\n  \"aff_tag\": \"Test Prescription\",\n  \"secure_pin\": \"111111\",\n  \"notify\": true,\n  \"send_sms\": true,\n  \"invoice_clinic\": false,\n  \"delivery_address\": {\n    \"address_ln1\": \"123 High Street\",\n    \"address_ln2\": \"\",\n    \"city\": \"London\",\n    \"post_code\": \"SW1A 1AA\",\n    \"country\": \"United Kingdom\"\n  },\n  \"prescription_id\": \"\",\n  \"patient\": {\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"gender\": \"male\",\n    \"email\": \"john.doe@example.com\",\n    \"phone\": \"441234567890\",\n    \"birth_day\": \"15\",\n    \"birth_month\": \"06\",\n    \"birth_year\": \"1985\",\n    \"address_ln1\": \"123 High Street\",\n    \"address_ln2\": \"\",\n    \"city\": \"London\",\n    \"post_code\": \"SW1A 1AA\",\n    \"country\": \"United Kingdom\",\n    \"client_ref_id\": \"TEST-001\"\n  },\n  \"notes\": \"\",\n  \"client_ref_id\": \"\",\n  \"medicines\": [\n    {\n      \"object\": \"medicine\",\n      \"id\": 0,\n      \"VPID\": \"42089511000001103\",\n      \"APID\": \"\",\n      \"VPPID\": \"\",\n      \"APPID\": \"\",\n      \"description\": \"Sildenafil 25mg tablets\",\n      \"qty\": \"10\",\n      \"directions\": \"Take as directed\"\n    }\n  ],\n  \"prescriber_ip\": \"127.0.0.1\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/prescriptions/issue",
          "host": ["{{baseUrl}}"],
          "path": ["api", "prescriptions", "issue"]
        }
      }
    },
    {
      "name": "List Prescriptions",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/prescriptions",
          "host": ["{{baseUrl}}"],
          "path": ["api", "prescriptions"]
        }
      }
    },
    {
      "name": "Webhook Event",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"event_type\": \"prescription.status_updated\",\n  \"prescription_id\": \"SRX-12345\",\n  \"status\": \"Delivered\",\n  \"data\": {\n    \"tracking_number\": \"TRACK123\"\n  },\n  \"timestamp\": \"2025-10-18T18:00:00.000Z\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/webhooks/signaturerx",
          "host": ["{{baseUrl}}"],
          "path": ["api", "webhooks", "signaturerx"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    }
  ]
}
```

---

## Testing OAuth Flow

To test the OAuth flow directly, you can check the token status in the backend logs. The service will automatically:

1. Fetch a token on first API call
2. Cache the token in memory
3. Automatically refresh when expired
4. Retry failed requests with new token

Monitor the backend logs to see:
```
🔑 Fetching new access token...
✅ Token fetched successfully, expires in 3600 seconds
📤 Issuing prescription to SignatureRx for patient: john.doe@example.com
✅ Prescription issued successfully
```

---

## Common Test Scenarios

### Scenario 1: Create and Track Prescription

1. Create a prescription:
```bash
curl -X POST http://localhost:3001/api/prescriptions/issue \
  -H "Content-Type: application/json" \
  -d @prescription-payload.json
```

2. List all prescriptions to verify:
```bash
curl http://localhost:3001/api/prescriptions
```

3. Simulate webhook update:
```bash
curl -X POST http://localhost:3001/api/webhooks/signaturerx \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "prescription.status_updated",
    "prescription_id": "SRX-12345",
    "status": "Delivered",
    "data": {},
    "timestamp": "2025-10-18T18:00:00.000Z"
  }'
```

4. Check updated status:
```bash
curl http://localhost:3001/api/prescriptions
```

---

## Error Handling

The API handles various error scenarios:

### Invalid Credentials (401)
If SignatureRx credentials are invalid:
```json
{
  "error": "Authentication failed with SignatureRx"
}
```

### Missing Required Fields (400)
If required fields are missing in the request:
```json
{
  "error": "Validation error: patient.email is required"
}
```

### Internal Server Error (500)
If an unexpected error occurs:
```json
{
  "error": "Failed to create prescription: Network timeout"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- UUIDs are automatically generated for database records
- The API uses CORS to allow frontend access
- Patient data is stored in PostgreSQL for audit purposes
- Webhook events are logged in the database
