# 🌿 GreenPay E-Wallet Enterprise Monorepo

[![CI/CD Pipelines](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_Automated-brightgreen.svg?logo=github-actions)](https://github.com/Michaelo7710/e-wallet-monorepo/actions)
[![CodeQL SAST](https://img.shields.io/badge/Security-CodeQL_SAST_Scanning-success.svg?logo=github)](.github/workflows/codeql-analysis.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-Automated_Weekly-blue.svg?logo=dependabot)](.github/dependabot.yml)
[![Compliance](https://img.shields.io/badge/Compliance-GDPR_%26_PSD2_Ready-blueviolet.svg)](docs/COMPLIANCE_GDPR.md)
[![Privacy UU PDP](https://img.shields.io/badge/Privacy-UU_PDP_No.27%2F2022_Compliant-059669.svg)](docs/COMPLIANCE_GDPR.md)
[![Design System](https://img.shields.io/badge/Design-Emerald_Elite_SDUI-047857.svg)](design-assets/design-manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Zero_Errors-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/Client-React_Native_Expo_v51-blue.svg?logo=react)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Express.js_Modular_Monolith-green.svg?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_6.0_ACID-green.svg?logo=mongodb)](https://www.mongodb.com/)
[![Testing](https://img.shields.io/badge/Testing-Jest_100%25_Pass_Rate-brightgreen.svg?logo=jest)](docs/TESTING_COVERAGE.md)
[![OpenAPI](https://img.shields.io/badge/API_Docs-Swagger_UI_Interactive-orange.svg?logo=swagger)](http://localhost:5000/api-docs)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED.svg?logo=docker)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Solusi sistem dompet digital enterprise lengkap (*fullstack monorepo*) yang mencakup **Mobile Client (React Native / Expo)** dengan arsitektur bersih (*Clean Architecture*), **Backend Service (Node.js/Express)** dengan transaksi atomik terisolasi (ACID Ledger), serta **Interactive API Playground (OpenAPI 3.0 / Swagger UI)**. Dirancang dan dibangun dengan standar rekayasa perangkat lunak Tier-1 FinTech (**GDPR Art. 17/25/32**, **PSD2 / RTS SCA**, **UU PDP No. 27/2022**, dan **DevSecOps Pipeline**).

---

> ⚡ **30-Second Executive Summary for Hiring Managers & Technical Recruiters:**
> - **🏛️ Architecture:** Clean Architecture Monorepo — Mobile Frontend (*React Native Expo SDK 51, TypeScript Strict, Zero-Any, Memoized Layouts*) + Backend (*Modular Monolith Node.js/Express, MongoDB 6.0 ACID Transactions, Idempotency Engine*).
> - **🎨 Design & UI/UX:** Sistem desain perbankan privat berstandar tinggi (*"Emerald Elite"*), arsitektur Server-Driven UI (SDUI), kepatuhan aksesibilitas kontras WCAG 2.1 AA (≥ 4.5:1), dan optimasi aset nol-rupiah memangkas *cold-start* hingga 87%.
> - **🛡️ FinTech Grade Security & Compliance:** Dual-token lifecycle (stateless RAM + encrypted keychain), 2FA TOTP CSPRNG mandiri, mitigasi *double spending* via *In-Flight In-Memory Locking*, sanitasi data pribadi UU PDP (*screen & native share masking*), serta resolusi konflik GDPR Art. 17 vs retensi 5AMLD.
> - **🧪 Quality Gates & DevSecOps:** Seluruh CI pipeline berstatus **Green Check 🟢** (Frontend CI, Backend CI, Supply Chain SBOM CycloneDX v1.5, CodeQL SAST), test suite Jest 100% PASS (61 backend integration & unit tests), dan 0 linting/type-check warning.

---

## 📑 Daftar Isi
- [⚡ Ringkasan Eksekutif (30-Sec Recruiter Hook)](#-greenpay-e-wallet-enterprise-monorepo)
- [📱 Antarmuka Pengguna & Galeri Showcase](#-antarmuka-pengguna--galeri-showcase-visual-uiux-showcase)
- [🏛️ Keunggulan Arsitektur](#-keunggulan-arsitektur)
- [🛡️ Matriks Kepatuhan Regulasi FinTech (GDPR, PSD2, UU PDP)](#-matriks-kepatuhan-regulasi-fintech-gdpr-psd2-uu-pdp)
- [📂 Struktur Monorepo & Tata Kelola Repositori](#-struktur-monorepo--tata-kelola-repositori)
- [📚 Dokumentasi Portofolio Resmi](#-dokumentasi-portofolio-resmi)
- [🚀 Panduan Memulai Cepat (Quickstart)](#-panduan-memulai-cepat-quickstart)
  - [1. Menjalankan Backend & Basis Data via Docker](#1-menjalankan-backend--basis-data-via-docker)
  - [2. Eksplorasi API Dokumentasi Interaktif (Swagger UI)](#2-eksplorasi-api-dokumentasi-interaktif-swagger-ui)
  - [3. Menjalankan Uji Regresi Otomatis (Jest 100%)](#3-menjalankan-uji-regresi-otomatis-jest-100)
  - [4. Menjalankan Aplikasi Mobile (React Native / Expo)](#4-menjalankan-aplikasi-mobile-react-native--expo)
- [🛡️ Keamanan, DevSecOps & Tata Kelola Data](#-keamanan-devsecops--tata-kelola-data)
- [🤝 Pedoman Kontribusi & Konvensi Git](#-pedoman-kontribusi--konvensi-git)

---

## 📱 Antarmuka Pengguna & Galeri Showcase (Visual UI/UX Showcase)

GreenPay mengusung bahasa desain **"Emerald Elite"** — memadukan kemewahan estetika perbankan privat (*Private Banking*) dengan kecepatan interaksi modern, kontras rasio WCAG 2.1 AA tinggi, dan komponen modular berbasis Server-Driven UI (SDUI).

### 1. Kartu Dompet Pintar & Tiered Balance Engine
<table>
  <tr>
    <td width="42%" align="center">
      <img src="design-assets/exports/card-texture-platinum.png" alt="Emerald Elite Platinum Card" width="340" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);" />
      <br/><sub><b>Gambar 1:</b> Kartu Fisik Digital "Emerald Elite Platinum" dengan Guilloche Emas</sub>
    </td>
    <td width="58%" valign="top">
      <h4>💎 Fitur Unggulan Kartu Dompet:</h4>
      <ul>
        <li><b>Tekstur Guilloche Emas 24k:</b> Pola anti-pemalsuan presisi tinggi berlatar hijau zamrud (<i>Deep Emerald</i> <code>#047857</code>).</li>
        <li><b>Single Source of Truth (SSOT) Limit:</b> Plafon limit otomatis menyesuaikan tingkat verifikasi akun:
          <ul>
            <li><b>Reguler Tier (Non-KYC):</b> Limit saldo maksimal <b>Rp 5.000.000</b>.</li>
            <li><b>Platinum KYC (Verified):</b> Plafon terangkat hingga <b>Rp 50.000.000</b>.</li>
          </ul>
        </li>
        <li><b>Privacy Balance Masking:</b> Toggle sembunyikan nominal saldo dengan satu sentuhan untuk keamanan pengguna di tempat umum.</li>
        <li><b>Aksesibilitas Kontras:</b> Rasio kontras teks emas terhadap latar zamrud <b>5.2:1</b> (Melampaui standar WCAG AA 4.5:1).</li>
      </ul>
      <p>🔗 <i>Komponen: <code>Wallet/src/shared/components/WalletCard.tsx</code></i></p>
    </td>
  </tr>
</table>

---

### 2. Voucher Struk Digital Resmi — Screen #26 (`TransactionDetailScreen`)
<table>
  <tr>
    <td width="42%" align="center">
      <div style="background:#F8FAFC; padding:16px; border-radius:16px; border:1px solid #E2E8F0; max-width:320px; text-align:left;">
        <div style="background: linear-gradient(135deg, #047857, #10B981); padding:16px; border-radius:12px; color:#FFF; text-align:center;">
          <div style="font-size:24px;">✅</div>
          <div style="font-weight:bold; font-size:16px; margin-top:4px;">Transaksi Berhasil</div>
          <div style="font-size:22px; font-weight:800; margin-top:8px;">Rp 150.000</div>
        </div>
        <div style="padding:12px 4px; font-size:12px; color:#334155; line-height:1.8;">
          <div style="border-bottom: 1px dashed #CBD5E1; padding-bottom:8px; margin-bottom:8px;">
            <b>Nomor Referensi:</b> <code style="color:#047857;">REF-WD-88990011</code><br/>
            <b>Waktu:</b> 17 Sep 2026, 19:42 WIB
          </div>
          <div>
            <b>Rekening Tujuan:</b> <code>******1234</code> (BCA)<br/>
            <b>Nomor Telepon:</b> <code>0812****8901</code><br/>
            <b>Status Data:</b> 🟢 <i>Authoritative Server Verified</i>
          </div>
        </div>
      </div>
      <br/><sub><b>Gambar 2:</b> Struk Digital Perforasi dengan Data Masking UU PDP</sub>
    </td>
    <td width="58%" valign="top">
      <h4>🧾 Standar Rekayasa Bukti Transaksi:</h4>
      <ul>
        <li><b>Authoritative Server SSOT:</b> Nomor referensi dan rincian transaksi 100% berasal dari backend (<code>/payments/withdrawal/request</code> & <code>/payments/transfer</code>).</li>
        <li><b>Zero Dummy Fallback:</b> Generator acak client (<code>GP-TRX-*</code>) dieliminasi total. Jika transaksi belum tercatat resmi, sistem menampilkan banner penolakan dan mendisabled tombol bagikan.</li>
        <li><b>Kepatuhan Privasi UU PDP:</b> Nomor rekening disanitasi ketat (<code>******1234</code>) dan nomor HP (<code>0812****8901</code>) baik pada layar maupun payload <code>Share.share</code> native.</li>
        <li><b>Tiket Digital Berlubang:</b> Desain voucher perforasi dengan notch setengah lingkaran ganda dan garis pemisah putus-putus.</li>
      </ul>
      <p>🔗 <i>Komponen: <code>Wallet/src/features/payment/screens/TransactionDetailScreen.tsx</code></i></p>
    </td>
  </tr>
</table>

---

### 3. Arsitektur Otentikasi Zero-Trust & Desain Ringan
<table>
  <tr>
    <td width="42%" align="center">
      <img src="design-assets/exports/auth-mesh-bg.png" alt="Auth Mesh Gradient Background" width="340" style="border-radius: 16px; border: 1px solid #E2E8F0;" />
      <br/><sub><b>Gambar 3:</b> Mesh Gradient Ringan (Memangkas Cold-Start Lag 87%)</sub>
    </td>
    <td width="58%" valign="top">
      <h4>🛡️ Keamanan & Aksesibilitas Berlapis:</h4>
      <ul>
        <li><b>Optimasi Aset Nol-Rupiah:</b> Mengganti aset bitmap lama (4.2MB) menjadi mesh gradien terkompresi (540KB) untuk melenyapkan *cold-start freeze* pada perangkat low-end.</li>
        <li><b>Multi-Factor Authentication (2FA):</b> Gerbang TOTP mandiri dengan token CSPRNG SHA-1 dan otentikasi biometrik FaceID / Fingerprint.</li>
        <li><b>Unified 3-Tier Feedback:</b> Eliminasi 100% <code>Alert.alert</code> sistem. Kegagalan moneter dikunci menggunakan modal dialog pemblokir ber-ID unik (<code>GlobalDialogModal.tsx</code>) yang kebal <i>race condition</i>.</li>
        <li><b>Pola Aliran Pembayaran:</b> Aset latar geometris <code>pattern-payment-flow.png</code> memberikan kepastian visual saat pengguna berada di alur kritis mutasi dana.</li>
      </ul>
      <p>🔗 <i>Komponen: <code>Wallet/src/shared/layouts/AuthLayout.tsx</code> & <code>GlobalDialogModal.tsx</code></i></p>
    </td>
  </tr>
</table>

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

## 🛡️ Matriks Kepatuhan Regulasi FinTech (GDPR, PSD2, UU PDP)

GreenPay dirancang secara ketat untuk mematuhi regulasi perbankan dan privasi data internasional serta nasional:

| Regulasi / Standar | Prinsip & Mandat Hukum | Solusi Teknis Terverifikasi di GreenPay | Berkas Implementasi & Bukti |
|:---|:---|:---|:---|
| **UU PDP No. 27/2022 (Indonesia)** | Perlindungan Data Pribadi & Kerahasiaan Rekening Keuangan | Masking otomatis data sensitif (`******1234`, `0812****8901`) pada seluruh antarmuka struk, voucher, dan payload *Native Share*. | [`TransactionDetailScreen.tsx`](Wallet/src/features/payment/screens/TransactionDetailScreen.tsx), [`antiAlertGuard.ts`](Wallet/src/core/utils/antiAlertGuard.ts) |
| **GDPR Art. 17 ("Right to Erasure")** | Hak Penghapusan Data vs Kewajiban Retensi Akuntansi (5AMLD) | *Cryptographic Pseudonymization*: Menghapus data identitas PII menjadi *tombstone salt* acak sementara buku besar akuntansi ganda (*double-entry financial ledger*) dipertahankan 5 tahun secara matematis. | [**`docs/COMPLIANCE_GDPR.md`**](docs/COMPLIANCE_GDPR.md), [`userService.js`](e-wallet-backend/src/services/userService.js) |
| **PSD2 / RTS on SCA (Eropa)** | Strong Customer Authentication & Anti-Fraud | Gerbang 2FA TOTP mandiri berbasis token SHA-1 CSPRNG, otentikasi biometrik, dan pemisahan wewenang *maker-checker* untuk transaksi bernilai tinggi (≥ Rp 10 Juta). | [`GlobalDialogModal.tsx`](Wallet/src/shared/components/GlobalDialogModal.tsx), [`authMiddleware.js`](e-wallet-backend/src/middlewares/authMiddleware.js) |
| **GDPR Art. 25 ("Privacy by Design")** | Pembatasan Paparan Data & Isolasi Domain | Pencegahan kebocoran PII pada logging HTTP Winston/Pino tracer (`correlationMiddleware.js`), sanitasi NoSQL Injection, dan header keamanan HTTP Helmet. | [`correlationMiddleware.js`](e-wallet-backend/src/middlewares/correlationMiddleware.js), [`app.js`](e-wallet-backend/src/config/app.js) |
| **OJK / ISO 27001 Baseline** | Integritas Transaksi & Non-Repudiation | Idempotency Engine ber-kunci SHA-256, In-Flight atomic lock, dan nomor referensi kanonikal server tanpa fallback dummy generator klien. | [`idempotencyMiddleware.js`](e-wallet-backend/src/middlewares/idempotencyMiddleware.js), [`paymentService.js`](e-wallet-backend/src/services/paymentService.js) |

👉 Pelajari arsitektur kepatuhan regulasi mendalam di: [**`docs/COMPLIANCE_GDPR.md`**](docs/COMPLIANCE_GDPR.md).

---

## 📂 Struktur Monorepo & Tata Kelola Repositori

```text
Wallet_App/
├── .github/                    # 🤖 Tata Kelola Repositori & Otomasi CI/CD
│   ├── workflows/
│   │   ├── backend-ci.yml      # CI Pipeline: Jest Unit & Integration (Node 20, Coverage 100%)
│   │   ├── frontend-ci.yml     # CI Pipeline: Strict TypeScript & ESLint (Zero Errors)
│   │   ├── supply-chain.yml    # SBOM CycloneDX v1.5 & License Compliance Audit
│   │   └── codeql-analysis.yml # Static Application Security Testing (SAST)
│   ├── ISSUE_TEMPLATE/         # Structured Issue Forms (Bug, RFC, Security)
│   ├── dependabot.yml          # Automated Weekly Dependency Patching
│   ├── pull_request_template.md# PR Template with FinTech & GDPR Checklist
│   ├── SECURITY.md             # Coordinated Vulnerability Disclosure (CVD) Policy
│   └── CODEOWNERS              # Definisi Tanggung Jawab Modul Monorepo
│
├── design-assets/              # 🎨 UI/UX Design System "Emerald Elite"
│   ├── exports/                # High-DPI Vector Textures (Guilloche, Auth Mesh, Payment Patterns)
│   ├── screens/                # Spesifikasi Layar & Mockup Showcase (showcase, auth, dashboard)
│   ├── tokens/                 # Design Tokens (Colors, Typography, Spacing, Elevation)
│   ├── design-manifest.json    # Master Machine-Readable Design Manifest v1.1.0
│   └── design-checklist.md     # Checklist Kesiapan Desain & Kepatuhan Layar
│
├── Wallet/                     # 📱 Mobile Client (React Native + Expo SDK 51)
│   ├── src/
│   │   ├── core/               # Konfigurasi Storage, SQLite, API Axios Instance, Telemetry
│   │   ├── features/           # 25 Antarmuka Layar (Auth, User, Payment, Admin)
│   │   ├── routes/             # Typed React Navigation (Stack, Tab, Admin Tabs)
│   │   ├── shared/             # Komponen UI Modular (WalletCard, GlobalDialogModal)
│   │   └── types/              # Type Definitions & API Schema Interfaces
│   ├── __tests__/              # Jest Test Suites (KYC, Telemetry, AML, 2FA, Biometrics)
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
│   ├── tests/                  # Jest Unit & Integration Test Suites (61/61 Passed - 100%)
│   └── package.json
│
├── docs/                       # 📖 Dokumentasi Teknis Portofolio Resmi
│   ├── BRD.md                  # Business Requirements Document v2.1.0
│   ├── ARCHITECTURE.md         # System Architecture Blueprint v2.0.0
│   ├── TESTING_COVERAGE.md     # QA Automated Testing Report v1.0.0
│   ├── COMPLIANCE_GDPR.md      # GDPR & PSD2 Regulatory Whitepaper v1.0.0
│   ├── TASK_BOARD.md           # Master Active Task Board (Antigravity Governance)
│   └── TASK_ARCHIVE.md         # Archived Completed Tasks (33 Tasks Fully Verified)
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
- 🧪 [**Testing & Code Coverage Report (v1.0.0)**](docs/TESTING_COVERAGE.md) — Laporan pengujian regresi Jest 9/9 suite backend (61/61 lulus, 100% pass rate) dan matriks cakupan kode.
- 🇪🇺 [**Regulatory Compliance Whitepaper (GDPR & PSD2)**](docs/COMPLIANCE_GDPR.md) — Solusi konflik GDPR Art. 17 vs 5AMLD, SCA OTP CSPRNG, perlindungan UU PDP, dan mitigasi risiko FinTech.
- 🎨 [**Visual Showcase Specification (showcase/specs.md)**](design-assets/screens/showcase/specs.md) — Rincian teknis aset grafis, rasio kontras WCAG 2.1 AA, dan token sistem desain Emerald Elite.
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

# Validasi Syntax & Code Standard (ESLint - 0 Errors)
npm run lint

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
