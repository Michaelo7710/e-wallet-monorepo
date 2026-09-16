# 🌿 GreenPay E-Wallet Enterprise Monorepo

[![CI/CD Pipelines](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_Automated-brightgreen.svg?logo=github-actions)](https://github.com/Michaelo7710/e-wallet-monorepo/actions)
[![CodeQL SAST](https://img.shields.io/badge/Security-CodeQL_SAST_Scanning-success.svg?logo=github)](.github/workflows/codeql-analysis.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-Automated_Weekly-blue.svg?logo=dependabot)](.github/dependabot.yml)
[![Compliance](https://img.shields.io/badge/Compliance-GDPR_&_PSD2_Ready-blueviolet.svg)](docs/COMPLIANCE_GDPR.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Zero_Errors-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/Client-React_Native_Expo_v51-blue.svg?logo=react)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Express.js_Modular_Monolith-green.svg?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_6.0_ACID-green.svg?logo=mongodb)](https://www.mongodb.com/)
[![Jest Tests](https://img.shields.io/badge/Testing-Jest_61%2F61_Passed_(100%25)-brightgreen.svg?logo=jest)](docs/TESTING_COVERAGE.md)
[![OpenAPI](https://img.shields.io/badge/API_Docs-Swagger_UI_Interactive-orange.svg?logo=swagger)](http://localhost:5000/api-docs)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED.svg?logo=docker)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Solusi sistem dompet digital enterprise lengkap (*fullstack monorepo*) yang mencakup **Mobile Client (React Native / Expo)** dengan arsitektur bersih (*Clean Architecture*), **Backend Service (Node.js/Express)** dengan transaksi atomik terisolasi (ACID Ledger), serta **Interactive API Playground (OpenAPI 3.0 / Swagger UI)**. Dirancang dan dibangun dengan standar rekayasa perangkat lunak Tier-1 FinTech Eropa (**GDPR Art. 17/25/32**, **PSD2 / RTS SCA**, dan **DevSecOps Pipeline**).

---

## 📑 Daftar Isi
- [Keunggulan Arsitektur](#-keunggulan-arsitektur)
- [🇪🇺 Standar FinTech Eropa & Regulasi (GDPR, PSD2)](#-standar-fintech-eropa--regulasi-gdpr-psd2)
- [Struktur Monorepo & Tata Kelola Repositori](#-struktur-monorepo--tata-kelola-repositori)
- [Dokumentasi Portofolio Resmi](#-dokumentasi-portofolio-resmi)
- [Panduan Memulai Cepat (Quickstart)](#-panduan-memulai-cepat-quickstart)
  - [1. Menjalankan Backend & Basis Data via Docker](#1-menjalankan-backend--basis-data-via-docker)
  - [2. Eksplorasi API Dokumentasi Interaktif (Swagger UI)](#2-eksplorasi-api-dokumentasi-interaktif-swagger-ui)
  - [3. Menjalankan Uji Regresi Otomatis (Jest 100%)](#3-menjalankan-uji-regresi-otomatis-jest-100)
  - [4. Menjalankan Aplikasi Mobile (React Native / Expo)](#4-menjalankan-aplikasi-mobile-react-native--expo)
- [Keamanan, DevSecOps & Tata Kelola Data](#-keamanan-devsecops--tata-kelola-data)
- [Pedoman Kontribusi & Konvensi Git](#-pedoman-kontribusi--konvensi-git)

---

## 🏛️ Keunggulan Arsitektur

```
+-----------------------------------------------------------------------------------+
|                            MOBILE CLIENT (REACT NATIVE)                           |
|  [Presentation: 25 Screens] <-> [Domain: UseCases] <-> [Data: Repos & DataSources]|
|             |                                                |                    |
|      (Secure Storage)                                (Offline SQLite)             |
|   Access Token (Memory/SSOT)                       Local Ledger & Balance         |
|   Refresh Token (Encrypted)                           Background Sync             |
+-----------------------------------------------------------------------------------+
                                       | HTTPS (Dual-Token Auth + Idempotency Headers)
                                       v
+-----------------------------------------------------------------------------------+
|                        BACKEND MODULAR MONOLITH (EXPRESS.JS)                      |
|  [Security Middlewares: RateLimit, Helmet, Anti-Brute, IdempotencyGuard, Auth]    |
|                                       |                                           |
|       +----------------+---------------+---------------+----------------+         |
|       | Auth Context   | User Context  | Payment Engine| Admin Clearing |         |
|       +----------------+---------------+---------------+----------------+         |
|               |                |               |                |                 |
|      (Dual-Token/OTP)    (KYC/Profile)   (ACID Ledger)   (Maker-Checker)          |
+-----------------------------------------------------------------------------------+
            |                                       |                     |
            v                                       v                     v
+-----------------------+              +-----------------------+ +------------------+
| MONGODB REPLICA SET   |              | MIDTRANS SNAP GATEWAY | | SMTP NOTIFICATION|
| (ACID Transactions,   |              | (Payment Redirect &   | | (Mailtrap OTP    |
| Polymorphic Ledger)   |              | Idempotent Webhooks)  | | CSPRNG Delivery) |
+-----------------------+              +-----------------------+ +------------------+
```

1. **Idempotency Guard & Anti-Double Spending:**
   - Middleware `idempotencyMiddleware.js` mengunci request mutasi saldo secara real-time via *In-Flight In-Memory Locking* (mencegah double-click atau network retry duplicate).
   - Replay request yang sudah tuntas dikembalikan instan melalui cache response (`X-Cache: HIT`) tanpa membebani database engine.
2. **Dual-Token Authentication Lifecycle:**
   - Access Token (15m stateless di transient memory) + Refresh Token (7d terenkripsi di `expo-secure-store`).
   - Axios request interceptor dengan fitur *queue & replay* otomatis saat mendeteksi `401 Unauthorized`.
   - Revokasi sesi seketika (*kill-switch*) pada database saat pengguna logout.
3. **Zero Token Leakage:**
   - Tidak menggunakan `AsyncStorage` untuk kredensial otentikasi. Semua token dan rahasia aplikasi disimpan eksklusif pada storage terisolasi tingkat perangkat keras (*iOS Keychain / Android Keystore*).
4. **Performance & Green Computing:**
   - `FlatList` pada `HistoryScreen.tsx` dilengkapi `getItemLayout` berdimensi statis (80px) untuk meniadakan dynamic layout measurement pada Hermes engine, mereduksi konsumsi memori dan daya baterai.

---

## 🇪🇺 Standar FinTech Eropa & Regulasi (GDPR, PSD2)

GreenPay dirancang memenuhi standar operasional pasar Eropa (EU/EEA & UK):
- **GDPR Article 17 ("Right to Erasure") vs 5AMLD ("Statutory Retention"):** Mengatasi paradoks hukum FinTech melalui *Cryptographic Pseudonymization*. Identitas PII dihapus/dianonimkan menjadi tombstone salt, sementara jurnal buku besar (*double-entry financial ledger*) dipertahankan secara matematis untuk kepatuhan anti-pencucian uang 5 tahun.
- **PSD2 / RTS on Strong Customer Authentication (SCA):** Transaksi bernilai tinggi (High-Value Transfer ≥ Rp 10 Juta) mewajibkan verifikasi ganda (2FA OTP CSPRNG) dan mekanisme *maker-checker* kliring admin.
- **Privacy by Design (GDPR Art. 25):** Isolasi ketat domain data, pencegahan PII logging pada Winston/Pino HTTP tracer (`correlationMiddleware.js`), serta sanitasi input terhadap NoSQL Injection & Cross-Site Scripting (XSS).

👉 Pelajari arsitektur kepatuhan mendalam di: [**`docs/COMPLIANCE_GDPR.md`**](docs/COMPLIANCE_GDPR.md).

---

## 📂 Struktur Monorepo & Tata Kelola Repositori

```text
Wallet_App/
├── .github/                    # 🤖 Tata Kelola Repositori & Otomasi CI/CD
│   ├── workflows/
│   │   ├── backend-ci.yml      # CI Pipeline: Jest Unit & Integration (Node 20)
│   │   ├── frontend-ci.yml     # CI Pipeline: Strict TypeScript & ESLint
│   │   ├── supply-chain.yml    # SBOM CycloneDX v1.5 & License Compliance Audit
│   │   └── codeql-analysis.yml # Static Application Security Testing (SAST)
│   ├── ISSUE_TEMPLATE/         # Structured Issue Forms (Bug, RFC, Security)
│   ├── dependabot.yml          # Automated Weekly Dependency Patching
│   ├── pull_request_template.md# PR Template with FinTech & GDPR Checklist
│   ├── SECURITY.md             # Coordinated Vulnerability Disclosure (CVD) Policy
│   └── CODEOWNERS              # Definisi Tanggung Jawab Modul Monorepo
│
├── Wallet/                     # 📱 Mobile Client (React Native + Expo SDK 51)
│   ├── src/
│   │   ├── core/               # Konfigurasi Storage, SQLite, API Axios Instance
│   │   ├── features/           # 25 Antarmuka Layar (Auth, User, Payment, Admin)
│   │   ├── routes/             # Typed React Navigation (Stack, Tab, Admin Tabs)
│   │   └── types/              # Type Definitions & API Schema Interfaces
│   ├── package.json
│   └── tsconfig.json           # Strict Mode (Zero TS Errors)
│
├── e-wallet-backend/           # 🌐 Backend Modular Monolith (Node.js / Express)
│   ├── src/
│   │   ├── config/             # DB Connection, Swagger Specs, App Setup
│   │   ├── controllers/        # Request Handlers (Auth, User, Payment, Admin)
│   │   ├── middlewares/        # Idempotency, Correlation ID, Auth, Error Handler
│   │   ├── models/             # Mongoose Models (ACID Schema & Indices)
│   │   ├── routes/             # 24 Endpoint Terstruktur (v1 REST API)
│   │   ├── services/           # Logika Bisnis FinTech (Double-Entry Ledger)
│   │   └── utils/              # AppError, JWT, CSPRNG OTP, Pino Logger
│   ├── tests/                  # Jest Unit & Integration Test Suites (100% Pass)
│   └── package.json
│
├── docs/                       # 📖 Dokumentasi Teknis Portofolio Resmi
│   ├── BRD.md                  # Business Requirements Document v2.1.0
│   ├── ARCHITECTURE.md         # System Architecture Blueprint v2.0.0
│   ├── TESTING_COVERAGE.md     # QA Automated Testing Report v1.0.0
│   └── COMPLIANCE_GDPR.md      # GDPR & PSD2 Regulatory Whitepaper v1.0.0
│
├── scripts/                    # 🛡️ DevSecOps Tooling (SBOM, License Auditing)
├── docker-compose.yml          # 🐳 Konfigurasi Multi-Container (App + MongoDB 6.0)
├── CONTRIBUTING.md             # 🤝 Panduan Kontribusi & Konvensi Git
├── LICENSE                     # ⚖️ Lisensi Open Source (MIT)
└── README.md
```

---

## 📚 Dokumentasi Portofolio Resmi

Portofolio ini disusun dengan standar arsitektur profesional enterprise. Rincian dokumen pendukung:
- 📋 [**Business Requirements Document (BRD v2.1.0)**](docs/BRD.md) — Pemetaan 24 endpoint API dan 25 antarmuka layar mobile berdasarkan matriks kebutuhan bisnis FinTech.
- 📐 [**System Architecture Blueprint (v2.0.0)**](docs/ARCHITECTURE.md) — Diagram topologi sistem, Entity-Relationship Diagram (ERD), mitigasi kegagalan, dan audit Clean Architecture.
- 🧪 [**Testing & Code Coverage Report (v1.0.0)**](docs/TESTING_COVERAGE.md) — Laporan pengujian regresi Jest 9/9 suite (100% pass rate) dan matriks cakupan kode.
- 🇪🇺 [**Regulatory Compliance Whitepaper (GDPR & PSD2)**](docs/COMPLIANCE_GDPR.md) — Solusi konflik GDPR Art. 17 vs 5AMLD, SCA OTP CSPRNG, dan mitigasi risiko FinTech.
- 🛡️ [**Security Policy & Vulnerability Disclosure**](.github/SECURITY.md) — Kebijakan pelaporan kerentanan, SLA patching, dan isolasi hardware.

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Menjalankan Backend & Basis Data via Docker

Gunakan Docker Compose untuk menginisialisasi lingkungan database dan backend dalam satu perintah:

```bash
# Di direktori utama Wallet_App
docker compose up -d --build
```
Layanan akan otomatis berjalan di:
- **Backend API:** `http://localhost:5000`
- **MongoDB 6.0:** `mongodb://localhost:27017/ewallet`

### 2. Eksplorasi API Dokumentasi Interaktif (Swagger UI)

Backend GreenPay menyediakan antarmuka OpenAPI interaktif bawaan:
1. Pastikan backend telah berjalan (`npm run dev` atau melalui Docker).
2. Buka peramban web (*browser*) Anda dan akses:
   👉 [**http://localhost:5000/api-docs**](http://localhost:5000/api-docs)
3. Spesifikasi OpenAPI raw JSON tersedia di:
   👉 [**http://localhost:5000/api-docs.json**](http://localhost:5000/api-docs.json)

### 3. Menjalankan Uji Regresi Otomatis (Jest 100%)

Untuk memvalidasi integritas kode backend secara komprehensif:

```bash
cd e-wallet-backend

# Jalankan seluruh test suite
npm test

# Jalankan pengujian dengan rincian matriks coverage
npm test -- --coverage
```
*Hasil: 9 Suites Passed, 61 Tests Passed (100% Pass Rate).*

### 4. Menjalankan Aplikasi Mobile (React Native / Expo)

```bash
cd Wallet

# Install dependencies
npm install

# Validasi Type Safety TypeScript (Strict - 0 Errors)
npx tsc --noEmit

# Jalankan Metro Bundler
npx expo start
```
*Gunakan aplikasi Expo Go pada perangkat Android/iOS fisik atau Android Emulator untuk menjelajahi 25 antarmuka layar.*

---

## 🛡️ Keamanan, DevSecOps & Tata Kelola Data

- **CodeQL SAST Automation:** Pemindaian celah keamanan kode otomatis di GitHub Actions setiap push dan commit.
- **Automated Dependabot:** Pembaharuan versi dependensi terjadwal mingguan untuk mitigasi kerentanan zero-day.
- **CSPRNG Safe OTP:** Kode verifikasi 6 digit digenerate dengan `crypto.randomInt` (bukan `Math.random`) berdurasi kadaluwarsa 5 menit.
- **Argon2 / Bcrypt Password Hashing:** Salt hashing adaptif untuk mencegah serangan rainbow table.
- **SQL / NoSQL Injection Immunity:** Sanitasi `express-mongo-sanitize` dan parameterized query schema Mongoose.
- **Secret Sanitization:** Berkas repositori disanitasi penuh sesuai standar **GitHub Push Protection (GH013)**. Seluruh kredensial sensitif dioperasikan melalui variabel lingkungan `.env`.

---

## 🤝 Pedoman Kontribusi & Konvensi Git

Proyek ini mengadopsi standar kolaborasi tim teknik terdistribusi berstandar internasional:
- Konvensi Git: **Conventional Commits 1.0.0** (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`).
- Silakan pelajari pedoman alur kerja lengkap di: [**`CONTRIBUTING.md`**](CONTRIBUTING.md).
