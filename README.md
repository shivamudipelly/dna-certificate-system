# DNA Certificate Verification System

## Project Overview
A production-grade microservices architecture for generating and verifying DNA-encoded digital certificates.

## Architecture
- **Crypto Engine** (Port 8000): Python FastAPI. Handles SHA-256, AES-256 encryption, and chaotic dynamic DNA Encoding/Decoding.
- **API Gateway** (Port 5000): Node.js + Express. Handles JWT Authentication, Routing, MongoDB database operations, and QR Code generation.
- **Frontend** (Port 3000): React + Vite. Provides Admin dashboard and Public Verification Portal.
- **MongoDB Cloud**: Stores public IDs, encoded DNA payloads, and timestamp logs (No PII).

## Setup Instructions
1. Navigate to `crypto-engine`, `api-gateway`, and `frontend` directories.
2. Copy `.env.example` to `.env` in each and configure your variables.
3. Run `docker-compose up --build` from the root directory to start all 3 services.
