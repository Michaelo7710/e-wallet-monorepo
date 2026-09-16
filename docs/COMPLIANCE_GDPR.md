# 🇪🇺 Regulatory Compliance & Data Privacy Architecture
## GDPR (EU 2016/679) & PSD2 / SCA Standards in GreenPay

**Dokumen Versi:** 1.0.0  
**Tanggal Efektif:** 16 September 2026  
**Peran:** Principal FinTech Architect & Data Protection Officer (DPO) Advisory  
**Lingkup Regulasi:** European General Data Protection Regulation (GDPR), PSD2 / RTS on Strong Customer Authentication, and EU 5th Anti-Money Laundering Directive (5AMLD).

---

## 1. Executive Summary & Regulatory Context

Operating financial services in the European Union (EU/EEA) and global markets requires adherence to stringent regulatory frameworks. GreenPay is architected from the ground up on principles of **Privacy-by-Design and Privacy-by-Default (GDPR Art. 25)** and **Strong Customer Authentication (PSD2 Art. 97)**.

This document outlines the architectural patterns implemented across our monorepo to resolve complex real-world tensions between data erasure and immutable financial bookkeeping.

---

## 2. The Core FinTech Dilemma: GDPR Art. 17 vs. 5AMLD Art. 40

A critical architectural challenge in FinTech systems is the legal tension between:
1. **GDPR Article 17 ("Right to be Forgotten / Right to Erasure"):** The data subject's right to demand total deletion of personal data.
2. **EU 5th AML Directive (5AMLD) Article 40:** The statutory legal obligation to preserve transaction records, customer identification, and ledger history for a minimum of **5 years** post-relationship termination to combat financial fraud and terrorism financing.

```
       +-------------------------------------------------------------+
       |             USER REQUESTS ACCOUNT TERMINATION               |
       +-------------------------------------------------------------+
                                      |
                 +--------------------+--------------------+
                 v                                         v
   [GDPR Art. 17: Right to Erasure]          [5AMLD: Statutory Retention]
   - Full Name, Email, Phone,                - Immutable Transaction Ledger
   - IP Addresses, Auth Tokens,              - Amounts, Timestamps, Hashes,
   - Device Identifiers.                     - Double-Entry Journal Records.
                 |                                         |
                 +--------------------+--------------------+
                                      |
                                      v
         +---------------------------------------------------------+
         |     ARCHITECTURAL RESOLUTION: CRYPTOGRAPHIC SHREDDING   |
         |                   & PSEUDONYMIZATION                    |
         +---------------------------------------------------------+
         | 1. Clear PII fields in User record (`[REDACTED_GDPR]`).  |
         | 2. Purge Refresh Tokens & Session Keys in DB & Devices. |
         | 3. Replace User Foreign Keys with irreversible Pseudonym|
         |    UUID (`anon_usr_c49f8...`) in public read views.     |
         | 4. Ledger integrity is mathematically preserved!        |
         +---------------------------------------------------------+
```

### Architectural Resolution Implemented in GreenPay:
- **Irreversible Pseudonymization:** Upon approved account termination, identity attributes (`fullName`, `email`, `phoneNumber`, `deviceInfo`) are overwritten with cryptographic salt tombstones (`[ERASED_GDPR_TIMESTAMP]`).
- **Ledger Immutability:** Financial ledger entries (`Transaction`, `Wallet` balance histories) remain mathematically intact. The balance sheet continues to balance to zero (Double-Entry principles), preventing systemic audit failure while ensuring zero readable PII remains attached to the records.

---

## 3. GDPR Principles Operationalized

### 3.1. Article 5: Data Minimization & Storage Limitation
- **Zero Excessive Data:** GreenPay does not collect unnecessary demographic or location metadata.
- **Session Lifecycles:**
  - Stateless Access Tokens expire in **15 minutes**.
  - One-Time Passwords (OTP) expire in **5 minutes**.
  - Unverified registration records are auto-purged via TTL indexes after **15 minutes**.

### 3.2. Article 32: Security of Processing & Cryptographic Controls
- **At-Rest Protection:** Mobile session tokens are stored inside hardware-isolated secure enclaves (`expo-secure-store` via iOS Keychain and Android Keystore StrongBox). No auth secrets ever enter unencrypted `AsyncStorage`.
- **In-Transit Protection:** Mandatory TLS 1.3 encryption with strict HTTP response headers enforced via `helmet` (HSTS, Anti-Clickjacking, XSS filters).
- **Password Hygiene:** Salted and hashed using Argon2 / adaptive Bcrypt with memory-cost tuning to resist brute-force GPU attacks.

### 3.3. PII Redaction in Observability & Distributed Tracing
- Logging middleware (`logger.js`) implements automated sanitization filters.
- Correlation IDs (`X-Correlation-ID`) trace requests end-to-end without printing passwords, Bearer tokens, or raw payment recipient details into stdout.

---

## 4. PSD2 & Strong Customer Authentication (SCA) Compliance

Under European **Directive (EU) 2015/2366 (PSD2)** and the EBA Regulatory Technical Standards (RTS):

1. **Two-Factor Authentication (2FA / SCA):**
   - High-value transactions (≥ Rp 10,000,000 / equivalent €600+) trigger mandatory Secondary Challenge (OTP verification or Maker-Checker clearing).
2. **CSPRNG OTP Engine:**
   - One-Time Passwords are generated via `crypto.randomInt` (hardware entropy), strictly eliminating pseudo-random number generator (PRNG) predictability.
3. **Dynamic Linking & Anti-Tampering:**
   - Transaction approval requests are bound cryptographically to the specific amount and payee account. Any tampering of the payload invalidates the signature.
4. **Idempotency Mutation Guard:**
   - European financial networks enforce non-repudiation. Our `idempotencyMiddleware.js` uses atomic distributed request locking to prevent duplicate charge attempts during network stutter.

---

## 5. Summary Matrix for European Technical Auditors

| EU Regulatory Requirement | Article / Reference | GreenPay Implementation | Evidence in Codebase |
|:---|:---|:---|:---|
| **Privacy by Design** | GDPR Art. 25 | Clean Architecture separation; zero credentials in local DB | [`storage.ts`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/core/storage.ts) |
| **Right to Erasure** | GDPR Art. 17 | Cryptographic anonymization preserving ledger integrity | [`userService.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/e-wallet-backend/src/services/userService.js) |
| **Security of Processing** | GDPR Art. 32 | Argon2 hashing, CSPRNG OTP, SecureStore hardware isolation | [`authService.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/e-wallet-backend/src/services/authService.js) |
| **Strong Authentication** | PSD2 Art. 97 | Dual-Token JWT rotation, 2FA challenge on high-value transfer | [`paymentRoutes.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/e-wallet-backend/src/routes/paymentRoutes.js) |
| **Audit Trail & Integrity** | 5AMLD Art. 40 | Non-repudiation correlation ID & immutable transaction records | [`correlationMiddleware.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/e-wallet-backend/src/middlewares/correlationMiddleware.js) |
