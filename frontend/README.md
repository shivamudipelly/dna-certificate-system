# 🖥️ Frontend - University Certificate Portal

The frontend is a high-performance React 18 application built with Vite and TypeScript. It serves as the primary interface for university administrators to manage certificates and for the public to verify student records.

---

## ✨ Features & Capabilities

- 🔐 **Secure Admin Access** — Multi-role authentication (SuperAdmin, HOD, Clerk) with JWT-in-memory storage and auto-logout on session expiration.
- 🎓 **Premium Certificate Viewer** — High-fidelity, print-optimized certificate cards featuring security badges, digital seals, and scannable QR codes.
- 📜 **Digital Registry** — Powerful searching and filtering for all issued certificates with instant deep-link verification.
- 🖨️ **Print-Ready Layouts** — Custom CSS media queries optimized for A4 paper printing, ensuring certificates look professional on physical paper.
- 📱 **Responsive Design** — Fully adaptive UI using Tailwind CSS, supporting everything from high-resolution desktop monitors to mobile QR scanning.
- 🛡️ **Integrity Alerts** — Native handling of cryptographic states, displaying clear visual alerts for `TAMPERED`, `REVOKED`, or `EXPIRED` records.

---

## 🛠️ Technology Stack

- **Framework:** React 18 (Functional Components & Hooks)
- **Build Tool:** Vite (Lightning-fast HMR and optimized production bundling)
- **Language:** TypeScript (Strict type safety across API boundaries)
- **Styling:** Vanilla CSS + Tailwind CSS (Glassmorphism & Academic aesthetics)
- **Routing:** React Router 6 (Protected Route wrappers)
- **Icons:** Heroicons + Custom SVGs
- **UI Components:** Headless UI (Accessible modals & dropdowns)
- **Notifications:** React Hot Toast
- **API Client:** Axios (Interceptors for JWT attachment and generic error handling)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn

### Installation
1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    Create a `.env` file based on `.env.example`:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

### Development
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
Generate a highly-optimized production bundle:
```bash
npm run build
```
The output will be in the `dist/` directory, ready to be served by any static host.

---

## 📁 Internal Architecture

- `src/components/` — Reusable UI primitives (Buttons, Modals, Logos).
- `src/components/certificate/` — The core `PremiumCertificateCard` logic including print-styles.
- `src/pages/admin/` — Role-protected dashboards and issuance forms.
- `src/pages/public/` — Public-facing verification and search portal.
- `src/context/` — Global auth state and user context.
- `src/services/` — API abstraction layer matching the Gateway specification.
- `tests/` — Integration and unit tests using Vitest and React Testing Library.

---

## 🧪 Testing

We use Vitest for lightning-fast testing.
```bash
npm test          # Run all tests
npm run coverage  # Generate coverage reports
```

---

## 🎨 Design System

The application uses a "Cyber-Academic" design system:
- **Primary Color:** `#7c3aed` (Violet / Academic authority)
- **Success Color:** `#10b981` (Emerald / Verified state)
- **Backgrounds:** Deep charcoals with glassmorphism overlays.
- **Typography:** Inter (Standard) and JetBrains Mono (Cryptographic IDs).
