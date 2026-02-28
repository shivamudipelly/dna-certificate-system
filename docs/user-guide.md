# User Guide

This guide covers how to use the DNA Certificate System as an **Admin** (issuing and managing certificates) or as a **Verifier** (verifying certificates). No technical knowledge is required.

---

## Part 1 — Admin Guide

Admins use the dashboard to issue certificates, view issued certificates, and download QR codes. There are three admin roles:

| Role | Can Issue | Can View Own | Can Revoke |
|---|---|---|---|
| Clerk | ✅ | ✅ | ❌ |
| HOD | ✅ | ✅ | ❌ |
| SuperAdmin | ✅ | ✅ | ✅ |

---

### 1.1 Logging In

1. Open the application in your browser (e.g., `https://your-app.vercel.app`)
2. You will see the **Admin Login** page
3. Enter your **email** and **password**
4. Click **Login**

> **Login is rate-limited** to 5 attempts per minute from the same device. If you exceed this, wait 1 minute before trying again.

If you see **"Invalid credentials"** — check your email and password carefully. Passwords are case-sensitive.

---

### 1.2 Issuing a Certificate

1. After logging in, you land on the **Admin Dashboard**
2. Find the **Issue Certificate** form (usually in the left panel or top section)
3. Fill in all required fields:

| Field | Description | Example |
|---|---|---|
| **Student Name** | Full legal name | `Anjali Sharma` |
| **Roll Number** | Institutional ID | `CS2021001` |
| **Degree** | Full degree name | `B.Tech Computer Science` |
| **CGPA** | Grade point average (0.00 – 10.00) | `8.75` |
| **Graduation Year** | Year of degree completion | `2024` |

4. Click **Issue Certificate**
5. Wait a few seconds — the system encrypts the data into a DNA sequence
6. On success you will see:
   - A **QR code image** — save or share this
   - A **certificate ID** (`public_id`) — a 10-character code
   - A **verification URL** — a direct link anyone can visit

**What to do with the QR code:**
- Print it on the physical certificate document
- Email it to the student alongside their certificate
- Embed it in a digital certificate PDF

---

### 1.3 Viewing Issued Certificates

The **My Certificates** section (or table) shows all certificates you have issued, **20 per page**.

For each certificate you can see:
- **Public ID** — the unique certificate identifier
- **Issued At** — date and time of issuance
- **Status** — `active` or `revoked`
- **Verification Count** — how many times this certificate has been verified
- **Last Verified** — when it was most recently verified

> **Note:** Raw certificate data (name, degree, etc.) is never shown in the list — it exists only inside the encrypted DNA payload. To see the data, use the public verification portal with the certificate's Public ID.

Use the **page** controls to navigate through older certificates.

---

### 1.4 Revoking a Certificate (SuperAdmin only)

If a certificate was issued in error or needs to be invalidated:

1. Find the certificate in **My Certificates** list
2. Click the **Revoke** button next to it
3. Confirm the action in the dialog

Once revoked:
- Any future verification attempt returns: **"This certificate has been revoked"**
- Revocation is **permanent and cannot be undone** via the UI
- The audit log records your admin ID and timestamp

---

### 1.5 Logging Out

Click the **Logout** button in the top-right corner of the dashboard.

> Your session token is stored only in browser memory — it is automatically cleared when you close the tab or refresh the page.

---

## Part 2 — Verifier Guide

Anyone (students, employers, institutions) can verify a certificate for free — no account required.

---

### 2.1 Verifying via QR Code

1. Open a QR code scanner on your phone (most phones have this built into the camera app)
2. Point the camera at the QR code on the certificate
3. Tap the link that appears — it opens the verification page automatically
4. The result appears within a few seconds

---

### 2.2 Verifying via Certificate ID

1. Open the application: `https://your-app.vercel.app/verify`
2. Enter the **Certificate ID** (10-character code, e.g., `a1b2c3d4e5`)
3. Click **Verify**

---

### 2.3 Understanding Verification Results

#### ✅ Valid Certificate
A green card showing the certificate details:
```
Name:    Anjali Sharma
Roll:    CS2021001
Degree:  B.Tech Computer Science
CGPA:    8.75
Year:    2024
Verified at: 28 Feb 2026, 09:15 AM
```
This confirms the certificate is genuine and unmodified.

#### ❌ Certificate Not Found
```
Certificate not found
```
The ID entered does not exist. Double-check the ID or scan the QR code again.

#### 🔴 TAMPERED — Data Modified
```
⚠️ TAMPERED — This certificate has been modified.
Its data cannot be trusted.
```
The encrypted data stored in the database was altered after issuance. This is a serious red flag — treat the certificate as fraudulent and contact the issuing institution.

#### 🔴 REVOKED — Certificate Invalidated
```
❌ This certificate has been revoked.
Please contact the issuing institution.
```
The issuing institution has revoked this certificate. It is no longer valid.

---

## Part 3 — Troubleshooting

### Common Issues and Solutions

#### "Invalid credentials" on login
- Check your email spelling and case
- Ensure Caps Lock is off
- Try the password again carefully — passwords are case-sensitive
- If you've forgotten your password, contact your system administrator (there is no self-service reset currently)

#### "Maximum login attempts exceeded"
- Wait exactly **1 minute** from your first failed attempt
- Then try again

#### "Certificate not found" when you have the QR code
- The QR code URL might have been truncated when printed — scan again at closer range
- Manually type the 10-character ID shown on the certificate
- Contact the issuing institution if the problem persists

#### QR code doesn't scan
- Improve lighting — avoid shadows on the QR code
- Clean your camera lens
- Try a QR code scanner app if your phone camera doesn't auto-detect it
- Use the manual ID entry method as a fallback

#### Certificate shows "TAMPERED"
- This is a **security alert** — do not accept the certificate as valid
- The encrypted certificate data was modified after it was issued
- Contact the issuing institution immediately and report the discrepancy

#### Page is slow or not loading
- Check your internet connection
- Try refreshing the page
- Clear your browser cache: press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Try a different browser (Chrome, Firefox, Edge all supported)

#### QR code was generated but verification fails
- Ensure the `FRONTEND_URL` environment variable matches the actual deployed URL
- Verification URLs use the format: `https://your-app.vercel.app/verify/:public_id`

---

## Part 4 — FAQ

**Q: Is my personal data stored securely?**  
A: Certificate data (name, degree, etc.) is encrypted into a DNA nucleotide sequence using AES-256 encryption before being stored. The database contains only the encrypted sequence — not your readable information. Even a full database breach would expose no plaintext personal data.

**Q: Can I verify a certificate without an account?**  
A: Yes. Verification is entirely public and requires no login, no registration, and no fee.

**Q: How long are certificates valid?**  
A: Certificates are valid indefinitely unless explicitly revoked by a SuperAdmin at the issuing institution.

**Q: What if the issuing institution changes their encryption keys?**  
A: All previously issued certificates would return `TAMPERED` if the cryptographic keys are changed — this is a known limitation. Key rotation requires a migration process. Institutions should treat their encryption keys as permanent organizational assets.

**Q: Can I export or download the certificate data?**  
A: The verification page shows the certificate data on screen. Use your browser's print function (`Ctrl+P`) to save it as a PDF.

**Q: Who can see which certificates were verified?**  
A: Verification events are logged anonymously (IP address, timestamp, `public_id`) in the server's audit log. Certificate data is not logged. Only system administrators with server access can view audit logs.

**Q: What browsers are supported?**  
A: All modern browsers — Chrome, Firefox, Safari, and Edge. The application is mobile-responsive and works on phones and tablets.

**Q: Can I re-issue a revoked certificate?**  
A: Not through the current UI. You would need to issue a new certificate with a new `public_id`, generating a new QR code.
