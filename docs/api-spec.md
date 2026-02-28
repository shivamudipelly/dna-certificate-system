# API Specification

All API Gateway endpoints are prefixed with `/api`. The Crypto Engine is internal-only and not directly callable from outside the Docker/Render network.

**Base URL (local):** `http://localhost:5000/api`  
**Base URL (production):** `https://dna-api-gateway.onrender.com/api`

---

## Authentication

Protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are issued on login, expire after **24 hours**, and must be kept in memory (not localStorage).

---

## Rate Limits

| Route Group | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | **5 requests** | per IP per minute |
| All `/api/*` routes | **100 requests** | per IP per minute |
| `GET /api/certificates/verify/:id` | **100 requests** | per IP per minute |

Rate limit exceeded response:
```json
HTTP 429
{ "success": false, "error": "Too many requests, please try again later." }
```

---

## Health Check

### `GET /api/health`

Returns service status. No authentication required.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "API Gateway",
  "timestamp": "2026-02-28T07:00:00.000Z"
}
```

---

## Authentication Routes

### `POST /api/auth/register`

Create a new admin account.

> **Note:** In the current build this route is open (no SuperAdmin guard) to allow initial setup. Lock it down after bootstrapping your first SuperAdmin.

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "SecurePass123",
  "role": "HOD",
  "department": "Computer Science"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | Minimum 8 characters |
| `role` | string | ❌ | `"HOD"`, `"Clerk"`, or `"SuperAdmin"` — defaults to `"Clerk"` |
| `department` | string | ❌ | Free text |

**Response `201 Created`:**
```json
{
  "success": true,
  "admin": {
    "id": "65a1b2c3d4e5f6789abc0001",
    "email": "admin@university.edu",
    "role": "HOD",
    "department": "Computer Science"
  }
}
```

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `400` | `"Please provide an email and password"` | Missing fields |
| `400` | `"Password must be at least 8 characters long"` | Short password |
| `400` | `"Invalid role assignment"` | Role not in allowed list |
| `400` | `"The provided email is already registered to an Admin account."` | Duplicate email |

---

### `POST /api/auth/login`

Authenticate an admin and receive a JWT token. **Rate limited to 5 attempts/min.**

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "SecurePass123"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "65a1b2c3d4e5f6789abc0001",
    "email": "admin@university.edu",
    "role": "HOD",
    "department": "Computer Science"
  }
}
```

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `400` | `"Please provide both email and password"` | Missing fields |
| `401` | `"Invalid credentials"` | Wrong email or password |
| `429` | `"Maximum login attempts exceeded..."` | Rate limit hit |

---

### `GET /api/auth/profile`

Get the currently authenticated admin's profile. **Requires JWT.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response `200 OK`:**
```json
{
  "success": true,
  "admin": {
    "_id": "65a1b2c3d4e5f6789abc0001",
    "email": "admin@university.edu",
    "role": "HOD",
    "department": "Computer Science",
    "lastLogin": "2026-02-28T06:45:00.000Z",
    "createdAt": "2026-01-10T12:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `401` | `"Not authorized, token required"` | Missing `Authorization` header |
| `401` | `"Not authorized, token invalid"` | Expired or malformed token |

---

## Certificate Routes

### `POST /api/certificates`

Issue a new certificate. **Requires JWT.** Roles: `HOD`, `Clerk`, `SuperAdmin`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Anjali Sharma",
  "roll": "CS2021001",
  "degree": "B.Tech Computer Science",
  "cgpa": "8.75",
  "year": "2024"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | ✅ | Non-empty, HTML-escaped |
| `roll` | string | ✅ | Non-empty, HTML-escaped |
| `degree` | string | ✅ | Non-empty, HTML-escaped |
| `cgpa` | string/float | ✅ | Float, `0.0` – `10.0` |
| `year` | string/int | ✅ | Integer, `1990` – `2100` |

**Response `201 Created`:**
```json
{
  "success": true,
  "public_id": "a1b2c3d4e5",
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "verification_url": "http://localhost/verify/a1b2c3d4e5"
}
```

| Field | Description |
|---|---|
| `public_id` | 10-character alphanumeric ID — used to look up the certificate |
| `qr_code` | Base64-encoded PNG QR code image pointing to `verification_url` |
| `verification_url` | Public URL anyone can visit to verify the certificate |

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `400` | `"Validation Failed"` + details array | Invalid field values |
| `401` | `"Not authorized..."` | Missing or invalid JWT |
| `500` | `"Internal server error"` | Crypto Engine unreachable or encryption failed |

---

### `GET /api/certificates`

List all certificates issued by the authenticated admin. **Requires JWT.** Paginated.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (20 results per page) |

**Response `200 OK`:**
```json
{
  "success": true,
  "certificates": [
    {
      "_id": "65a1b2c3d4e5f6789abc0002",
      "public_id": "a1b2c3d4e5",
      "chaotic_seed": 0.7312...,
      "status": "active",
      "issued_by": "65a1b2c3d4e5f6789abc0001",
      "issued_at": "2026-02-28T07:00:00.000Z",
      "verification_count": 3,
      "last_verified_at": "2026-02-28T09:00:00.000Z"
    }
  ],
  "total": 47,
  "page": 1
}
```

> **Note:** `dna_payload` is **never returned** in list responses — only metadata.

---

### `GET /api/certificates/verify/:public_id`

Verify a certificate by its public ID. **No authentication required.** Public endpoint.

**URL Parameters:**
| Param | Description |
|---|---|
| `public_id` | The 10-character ID from the certificate (or QR code URL) |

**Response `200 OK` — Valid certificate:**
```json
{
  "success": true,
  "data": {
    "name": "Anjali Sharma",
    "roll": "CS2021001",
    "degree": "B.Tech Computer Science",
    "cgpa": "8.75",
    "year": "2024"
  },
  "verified_at": "2026-02-28T09:15:00.000Z"
}
```

**Response `403 Forbidden` — Tampered certificate:**
```json
{
  "success": false,
  "error": "TAMPERED"
}
```

**Response `403 Forbidden` — Revoked certificate:**
```json
{
  "success": false,
  "error": "REVOKED"
}
```

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `404` | `"Certificate not found"` | `public_id` doesn't exist in DB |
| `403` | `"TAMPERED"` | DNA payload was modified in the database |
| `403` | `"REVOKED"` | A SuperAdmin revoked this certificate |

---

### `PUT /api/certificates/:public_id/revoke`

Revoke a certificate. **Requires JWT. Role: `SuperAdmin` only.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Certificate has been successfully revoked."
}
```

**Error Responses:**
| Status | Error | Cause |
|---|---|---|
| `400` | `"Certificate is already revoked"` | Already revoked |
| `401` | `"Not authorized..."` | Missing/invalid JWT |
| `403` | `"Forbidden"` | Role is not `SuperAdmin` |
| `404` | `"Certificate not found"` | Bad `public_id` |

---

## Internal Crypto Engine API

> ⚠️ These endpoints are **internal only**. They are not accessible from the public internet. Only the API Gateway can call them using the `x-api-key` header.

**Base URL (internal Docker):** `http://crypto-engine:8000`

### `GET /health`
Returns service status. No API key required.

**Response `200`:**
```json
{ "status": "ok", "service": "Crypto Engine" }
```

---

### `POST /encrypt`

Encrypt certificate data into a DNA sequence.

**Headers:** `x-api-key: <ENGINE_API_KEY>`

**Request:**
```json
{ "data": { "name": "Anjali Sharma", "roll": "CS2021001", ... } }
```

**Response `200`:**
```json
{
  "success": true,
  "dna_payload": "ATCGATCGTTAGC...",
  "chaotic_seed": 0.7312984561
}
```

---

### `POST /decrypt`

Decrypt a DNA payload back to certificate data, or detect tampering.

**Headers:** `x-api-key: <ENGINE_API_KEY>`

**Request:**
```json
{
  "dna_payload": "ATCGATCGTTAGC...",
  "chaotic_seed": 0.7312984561
}
```

**Response `200` — Success:**
```json
{ "success": true, "data": { "name": "Anjali Sharma", ... } }
```

**Response `403` — Tampered:**
```json
{ "success": false, "error": "TAMPERED" }
```

---

## Common Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Validation errors include a `details` array:
```json
{
  "success": false,
  "error": "Validation Failed",
  "details": [
    { "field": "cgpa", "message": "CGPA must be a standard float between 0 and 10" }
  ]
}
```

## Global Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing or invalid JWT) |
| `403` | Forbidden (wrong role, TAMPERED, or REVOKED) |
| `404` | Resource not found |
| `408` | Request timeout (>30s) |
| `413` | Request body too large (>10KB) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
