# 🤝 Contributing Guidelines — GreenPay Enterprise Monorepo

Thank you for your interest in contributing to the **GreenPay E-Wallet Enterprise Monorepo**! We maintain rigorous engineering, security, and architectural standards inspired by tier-1 European FinTech organizations.

---

## 1. Development Principles & Architecture Guidelines

1. **Clean Architecture Separation:**
   - **Mobile (`Wallet/`):** Maintain clear boundary isolation: `Domain` (Business rules & entities) $\perp$ `Data` (Repositories, SQLite, API) $\perp$ `Presentation` (React Native screens & components).
   - **Backend (`e-wallet-backend/`):** Adhere to the Modular Monolith pattern (`routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `models`).
2. **ACID Financial Integrity:**
   - All balance mutations MUST execute inside atomic MongoDB sessions (`withTransaction`).
   - Mutations MUST be guarded with idempotency middleware to prevent race conditions.
3. **Zero-Trust Security & GDPR Compliance:**
   - Never store authentication credentials or tokens in unencrypted storage (`AsyncStorage`). Use `expo-secure-store`.
   - Never log personal identifiable information (PII), plain passwords, or unmasked credit card / bank account numbers.

---

## 2. Git Workflow & Conventional Commits

We follow the **Conventional Commits 1.0.0** specification and a structured Git Flow:

### Branch Naming Convention
- `feat/feature-name` (New features or major capabilities)
- `fix/bug-description` (Bug fixes)
- `perf/optimization-target` (Performance enhancements)
- `refactor/scope` (Code refactoring without behavioral change)
- `docs/topic` (Documentation updates)

### Commit Message Format
```text
<type>(<scope>): <short description> [<TICKET_OR_TAG>]

[optional body explaining rationale]
```

**Allowed Types:**
- `feat`: A new feature for the user or API consumer.
- `fix`: A bug fix.
- `perf`: A code change that improves performance (e.g., zero-layout FlatList).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `docs`: Documentation-only changes.
- `ci`: Changes to our CI configuration files and scripts.

---

## 3. Local Verification & Quality Gates

Before submitting a Pull Request, you **MUST** ensure all automated quality gates pass locally:

```bash
# 1. Backend Integration Tests & Coverage (Must achieve 100% test pass rate)
cd e-wallet-backend
npm test -- --coverage

# 2. Mobile Client Strict TypeScript Verification (Must report 0 errors)
cd ../Wallet
npx tsc --noEmit

# 3. DevSecOps SBOM & Supply Chain License Audit
cd ..
npm run security:check-all
```

---

## 4. Pull Request (PR) Lifecycle

1. Fork or branch from `development` or `main`.
2. Ensure your PR description adheres to our [Pull Request Template](.github/pull_request_template.md).
3. Confirm all GitHub Actions CI checks (`Backend CI`, `Frontend CI`, `Supply Chain Security`, `CodeQL`) pass with green checkmarks.
4. Request review from module owners defined in [`.github/CODEOWNERS`](.github/CODEOWNERS).
