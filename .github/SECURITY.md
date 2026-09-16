# Security Policy & Responsible Disclosure — GreenPay Enterprise

GreenPay is committed to ensuring the highest level of security, cryptographic hygiene, and data privacy for our users, adhering to European banking standards (**PSD2 / RTS**) and regulatory data protections (**GDPR Art. 32**).

---

## 1. Supported Versions

Security patches and dependency updates are provided for the following release branches:

| Component | Branch / Version | Supported | Security Patch SLA |
|:---|:---:|:---:|:---:|
| **Backend API (Node.js)** | `v1.x` / `main` | :white_check_mark: | 24h Critical / 72h High |
| **Mobile Client (React Native)** | `v1.x` / `main` | :white_check_mark: | 48h Store Rollout |
| **Historical Releases** | `< 1.0.0` | :x: | Deprecated |

---

## 2. Core Security Architecture Guarantees

1. **Hardware-Isolated Storage (Zero Token Leakage):**
   - Access and refresh tokens are strictly barred from unencrypted storage (`AsyncStorage`).
   - All mobile session secrets utilize `expo-secure-store`, backed by the iOS Keychain (Secure Enclave) and Android Keystore (TEE/StrongBox).

2. **ACID Financial Integrity & Anti-Double Spending:**
   - Balance mutations (P2P Transfer, Top-Up, Withdrawal) are executed within atomic database sessions (`client.startSession()` with `withTransaction`).
   - Mutations are guarded against in-flight race conditions via an in-memory `idempotencyMiddleware` locking mechanism with TTL eviction.

3. **Cryptographic Standards:**
   - Passwords are salted and hashed using adaptively tuned Argon2 / Bcrypt.
   - One-Time Passwords (OTP) are generated using cryptographically secure pseudo-random number generators (`crypto.randomInt`), mitigating PRNG prediction exploits.
   - All communications strictly enforce TLS 1.3 with HSTS headers via `helmet`.

4. **Supply Chain DevSecOps:**
   - Continuous Software Bill of Materials (SBOM) generation adhering to CycloneDX v1.5 JSON standards.
   - Automated zero-tolerance checks for high/critical vulnerabilities via automated CI pipelines.

---

## 3. Reporting a Vulnerability (Coordinated Disclosure)

We take security vulnerabilities seriously. If you discover a vulnerability, please follow our **Coordinated Vulnerability Disclosure (CVD)** guidelines:

1. **Do NOT open a public GitHub issue.**
2. Send an encrypted email or private disclosure to our security triage team at:
   📧 `security@greenpay-fintech.internal` (or submit via [GitHub Private Security Advisory](https://github.com/Michaelo7710/e-wallet-monorepo/security/advisories/new)).
3. Include the following details:
   - Nature of the vulnerability (e.g., IDOR, race condition, auth bypass).
   - Step-by-step reproduction guide or minimal Proof of Concept (PoC).
   - Potential impact on financial assets, user balance, or PII.

### Our Commitment
- **Acknowledgment:** Within 24 hours of report receipt.
- **Triage & Remediation:** Critical vulnerabilities remediated within 72 hours.
- **Bounty & Credit:** Hall of Fame recognition upon coordinated public disclosure.

---

## 4. Regulatory & GDPR Compliance Notice

GreenPay processes personal and financial data in strict accordance with the **General Data Protection Regulation (EU 2016/679 - GDPR)**. Under Article 17 ("Right to Erasure"), user identifiers are pseudonymized upon account termination, while financial ledger entries are preserved under statutory anti-money laundering (**EU 5th AMLD**) legal retention obligations.
