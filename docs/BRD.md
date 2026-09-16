# Business Requirements Document (BRD) — GreenPay E-Wallet Enterprise

**Dokumen Versi:** 2.1.0  
**Tanggal Diperbarui:** 16 September 2026  
**Status:** Approved & Baselined  
**Peran Pembuat:** Senior Product Owner & Business Analyst  
**Dasar Acuan:** 
- Brief Mini-Proyek: `File Santri MP - E-Wallet.docx`
- Spesifikasi Backend: `Reshful-API.txt` (GreenPay E-Wallet Enterprise API v1.0.0)
- Codebase Eksisting: `Wallet_App` (React Native Expo & Node.js Express MongoDB)

---

## 1. Executive Summary & Visi Produk
GreenPay E-Wallet adalah platform dompet digital (fintech) berbasis mobile (Android/iOS) dan backend micro-service/modular monolith. Sistem ini dirancang untuk melayani transaksi keuangan digital secara aman, instan, dan mematuhi regulasi kepatuhan keuangan (KYC, Anti-Money Laundering/AML, dan perlindungan Anti-Double Spending).

Tujuan portofolio ini adalah mendemonstrasikan kapabilitas rekayasa tingkat **Enterprise / Production-Ready**, melampaui standar CRUD biasa melalui implementasi *atomic concurrency*, *tiered approval*, *idempotency keys*, *dual-token authentication*, serta *Clean Architecture* di sisi mobile client.

---

## 2. Pemetaan Pemangku Kepentingan (Stakeholders & Persona)
1. **Pengguna Reguler (End-User):** Melakukan registrasi, verifikasi OTP, top-up saldo via payment gateway, transfer P2P, dan penarikan saldo ke bank.
2. **Pengguna Terverifikasi (KYC Verified User):** Memiliki batas limit transaksi lebih tinggi dengan memasukkan 16-digit NIK yang sah.
3. **Admin Kliring / Operator Backoffice:** Mengaudit dan menyetujui/menolak permohonan penarikan dana (*withdrawal*), transfer bernilai tinggi (≥ Rp 10.000.000), serta memantau neraca kas (*financial report*).

---

## 3. Spesifikasi Modul Backend & Matriks 24 Endpoints API

### Modul 1: Autentikasi & Keamanan Akses (AUTH)
- **AUTH-01 (Registrasi):** `POST /api/v1/auth/register` — Pendaftaran user baru dengan sesi atomik ACID, inisialisasi dompet Rp 0, dan pengiriman 6-digit OTP kriptografis (CSPRNG).
- **AUTH-02 (Verifikasi Email):** `POST /api/v1/auth/verify-email` — Aktivasi akun via OTP dengan proteksi anti-replay attack (`is_used = true`).
- **AUTH-03 (Login Dual-Token):** `POST /api/v1/auth/login` — Autentikasi via Bcrypt (12 salt rounds), proteksi Anti-Brute Force (blokir 60 detik pasca 3x kegagalan), menerbitkan Access Token (15 menit) dan Refresh Token (7 hari tersimpan di database).
- **AUTH-04 (Rotasi Token):** `POST /api/v1/auth/refresh-token` — Pembaruan Access Token tanpa query berat ke user entity.
- **AUTH-05 (Logout):** `POST /api/v1/auth/logout` — Revokasi permanen Refresh Token dari database server.
- **AUTH-06 (Forgot Password):** `POST /api/v1/auth/forgot-password` — OTP reset password (kedaluwarsa 5 menit) dengan proteksi *anti-enumeration*.
- **AUTH-07 (Reset Password):** `POST /api/v1/auth/reset-password` — Eksekusi kata sandi baru pasca validasi OTP.
- **AUTH-08 (Generate 2FA Secret):** `POST /api/v1/auth/2fa/generate` — Penerbitan kunci rahasia Base32 CSPRNG (20 bytes) untuk Google Authenticator.
- **AUTH-09 (Verify 2FA Token):** `POST /api/v1/auth/2fa/verify` — Validasi HMAC-SHA1 dinamis dengan *time-window steps*.

### Modul 2: Profil & Manajemen Pengguna (USER)
- **USER-01 (Dasbor Profil & Saldo):** `GET /api/v1/users/me` — Mengambil data profil dan saldo terkini dalam single-roundtrip agregasi.
- **USER-02 (Setup PIN Perdana):** `POST /api/v1/users/setup-pin` — Penetapan 6-digit PIN transaksi ber-hash (mencegah overwrite).
- **USER-03 (Ubah Password):** `PATCH /api/v1/users/update-password` — Pembaruan kata sandi dari dalam aplikasi.
- **USER-04 (Ubah Email OTP):** `PATCH /api/v1/users/update-email` — Pemutakhiran email yang mewajibkan verifikasi PIN + OTP.
- **USER-05 (Ubah PIN Transaksi):** `PATCH /api/v1/users/update-pin` — Penggantian PIN lama ke PIN baru terverifikasi OTP.
- **USER-06 (Verifikasi KYC Akun):** `PATCH /api/v1/users/update-kyc` — Peningkatan status akun menjadi *verified* menggunakan validasi format 16-digit NIK.
- **USER-07 (Daftar Kontak Tersimpan):** `GET /api/v1/users/contacts` — Riwayat kontak penerima transfer (*auto-upsert*) terurut transaksi terbaru.

### Modul 3: Transaksi & Pembayaran (PAYMENT)
- **PAY-01 (Inisiasi Top Up Midtrans SNAP):** `POST /api/v1/payments/topup/initiate` — Menghasilkan Token SNAP & Payment Redirect URL, referensi `GP-TP-YYYYMMDD-XXXX`.
- **PAY-02 (Webhook Midtrans):** `POST /api/v1/payments/midtrans-webhook` — Verifikasi signature SHA-512, pemrosesan idempoten, dan mutasi saldo atomik ke ledger.
- **PAY-03 (Penarikan Dana / Withdrawal):** `POST /api/v1/payments/withdrawal/request` — Minimal Rp 50.000 dengan mekanisme *Hold Balance*. Transaksi < Rp 10 Juta otomatis sukses, ≥ Rp 10 Juta `pending_approval`.
- **PAY-04 (Transfer P2P Internal):** `POST /api/v1/payments/transfer` — Minimal Rp 10.000 dengan otentikasi PIN dan proteksi *Anti-Self-Transfer*. Transaksi ≥ Rp 10 Juta ditahan untuk persetujuan admin.
- **PAY-05 (Buku Besar Transaksi / Ledger):** `GET /api/v1/payments/history` — Agregasi riwayat mutasi debit/kredit dengan kalkulasi pagination cursor.

### Modul 4: Administrasi & Kliring (ADMIN)
- **ADM-01 (CRUD Rekening Platform):** `POST|GET|PUT|DELETE /api/v1/admin/banks` — Pengelolaan rekening bank penampung resmi milik platform.
- **ADM-02 (Audit Top Up Manual):** `GET /api/v1/admin/topups/pending` — Antrean verifikasi top-up manual pengguna.
- **ADM-03 (Approve/Cancel Top Up):** `PATCH /api/v1/admin/topups/:id/approve` & `cancel` — Keputusan mutasi kredit saldo manual.
- **ADM-04 (Retensi Top Up):** `DELETE /api/v1/admin/topups/:id` — Penghapusan rekam data berstatus final.
- **ADM-05 (Audit Withdrawal Pending):** `GET /api/v1/admin/withdrawals/pending` — Antrean penarikan dana keluar.
- **ADM-06 (Keputusan Withdrawal):** `PATCH /api/v1/admin/withdrawals/:id/approve` & `reject` — Kliring penarikan dana dengan *Conditional Auto-Refund*.
- **ADM-07 (Audit Transfer High-Value):** `GET /api/v1/admin/transfers/pending` — Antrean transaksi transfer P2P ≥ Rp 10 Juta.
- **ADM-08 (Keputusan Transfer High-Value):** `PATCH /api/v1/admin/transfers/:id/approve` & `reject` — Penerusan saldo atau *Refund* ke pengirim.
- **ADM-09 (Neraca Keuangan Real-Time):** `GET /api/v1/admin/financial-report` — Dashboard agregasi Mongoose ($sum) untuk memantau Liabilitas Saldo Beredar, Inflow, dan Outflow.

---

## 4. Spesifikasi Frontend Mobile & Katalog 25 Antarmuka Layar (Screens)

Struktur antarmuka pada folder `Wallet/src/features/` dipetakan ke dalam 25 layar mandiri berarsitektur bersih (*Clean Architecture*):

| No | Nama Layar (*Screen Component*) | Modul Fitur | Endpoint Backend Terkait | Peran & Alur Pengguna (*User Flow*) |
|:---:|:---|:---|:---|:---|
| 1 | `RegisterScreen.tsx` | `features/auth` | `AUTH-01` | Pendaftaran akun baru, validasi nomor ponsel & sandi |
| 2 | `VerifyEmailScreen.tsx` | `features/auth` | `AUTH-02` | Input 6-digit OTP aktivasi akun pendaftaran |
| 3 | `LoginScreen.tsx` | `features/auth` | `AUTH-03` | Otentikasi email & sandi, proteksi lockout anti-brute force |
| 4 | `ForgotPasswordScreen.tsx` | `features/auth` | `AUTH-06` | Permintaan OTP pemulihan kata sandi via email |
| 5 | `ResetPasswordScreen.tsx` | `features/auth` | `AUTH-07` | Form penetapan kata sandi baru pasca verifikasi OTP |
| 6 | `TwoFactorAuthScreen.tsx` | `features/auth` | `AUTH-09` | Gerbang validasi kode 6-digit Google Authenticator saat login |
| 7 | `HomeScreen.tsx` | `features/user` | `USER-01`, `PAY-05` | Dasbor utama saldo, tombol aksi cepat, dan mutasi terkini |
| 8 | `ProfileScreen.tsx` | `features/user` | `USER-01`, `AUTH-05` | Informasi profil, kasta akun (Reguler/KYC), dan tombol logout |
| 9 | `SetupPinScreen.tsx` | `features/user` | `USER-02` | Inisialisasi 6-digit PIN keamanan transaksi pertama kali |
| 10 | `ChangePasswordScreen.tsx` | `features/user` | `USER-03` | Pembaruan kata sandi mandiri dari dalam menu pengaturan |
| 11 | `ChangeEmailScreen.tsx` | `features/user` | `USER-04` | Penggantian email akun dengan proteksi PIN dan OTP email baru |
| 12 | `ChangePinScreen.tsx` | `features/user` | `USER-05` | Pergantian 6-digit PIN transaksi dengan verifikasi PIN lama & OTP |
| 13 | `TwoFactorSetupScreen.tsx` | `features/user` | `AUTH-08`, `AUTH-09` | Pemindaian QR Code TOTP & aktivasi 2FA mandiri |
| 14 | `KycVerificationScreen.tsx` | `features/user` | `USER-06` | Peningkatan akun ke Premium melalui pengunggahan 16-digit NIK |
| 15 | `HistoryScreen.tsx` | `features/user` | `PAY-05` | Riwayat transaksi lengkap berhalaman (*cursor-pagination*) |
| 16 | `TopUpScreen.tsx` | `features/payment` | `PAY-01` | Pemilihan nominal saldo dan inisiasi sesi SNAP Payment Midtrans |
| 17 | `SnapPaymentWebViewScreen.tsx` | `features/payment` | `PAY-01`, `PAY-02` | WebView rendering antarmuka kasir Midtrans SNAP payment gateway |
| 18 | `TransferScreen.tsx` | `features/payment` | `PAY-04`, `USER-07` | Form transfer P2P via nomor ponsel, buku kontak, & modal PIN |
| 19 | `WithdrawScreen.tsx` | `features/payment` | `PAY-03` | Form penarikan saldo ke nomor rekening bank tujuan |
| 20 | `AdminDashboardScreen.tsx` | `features/admin` | `ADM-09` | Pusat ringkasan operasional dan navigasi kliring backoffice |
| 21 | `AdminBankManagementScreen.tsx` | `features/admin` | `ADM-01` | Manajemen rekening bank penampung resmi platform (CRUD) |
| 22 | `AdminTopUpApprovalScreen.tsx` | `features/admin` | `ADM-02`, `ADM-03`, `ADM-04` | Audit dan aksi persetujuan/pembatalan permohonan top-up manual |
| 23 | `AdminWithdrawalApprovalScreen.tsx` | `features/admin` | `ADM-05`, `ADM-06` | Kliring permohonan penarikan dana dengan auto-refund on reject |
| 24 | `AdminTransferApprovalScreen.tsx` | `features/admin` | `ADM-07`, `ADM-08` | Kliring investigasi transfer bernilai tinggi (≥ Rp 10 Juta) |
| 25 | `AdminFinancialReportScreen.tsx` | `features/admin` | `ADM-09` | Laporan neraca likuiditas, total inflow, outflow harian & bulanan |

---

## 5. Matriks Prioritas Fitur (MoSCoW)
- **Must-Have:** Modul Auth Lengkap (Screen 1-6), Setup PIN (Screen 9), Top Up Midtrans & Webhook (Screen 16-17), Transfer P2P (Screen 18), Withdrawal (Screen 19), Polymorphic Ledger (Screen 15), Panel Persetujuan Admin (Screen 20-24).
- **Should-Have:** 2FA TOTP Authenticator (Screen 6, 13), Anti-Brute Force Lockout, High-Value Gate (≥ 10 Jt), Auto-Refund on Rejection, Saved Contacts Upsert, Dashboard Laporan Neraca (Screen 25).
- **Could-Have:** Biometric Hardware Auth (Fingerprint/FaceID via `expo-local-authentication`), Offline-First SQLite Ledger Cache, Dark Mode.
- **Won't-Have:** Pembayaran Merchant QRIS, Pembelian PPOB/Tagihan, Virtual Credit Card.

---

## 6. Kriteria Penerimaan (Acceptance Criteria - Gherkin BDD)

### Skenario 1: Transfer P2P Berhasil (Nominal Standar)
```gherkin
Given pengguna memiliki saldo dompet sebesar Rp 500.000 dan PIN valid
When pengguna mengirim saldo sebesar Rp 100.000 ke nomor telepon penerima yang valid pada TransferScreen
Then sistem memotong saldo pengirim sebesar Rp 100.000
And menambahkan saldo penerima sebesar Rp 100.000 secara atomik
And mencatat mutasi 'out' pada ledger pengirim dan 'in' pada ledger penerima
And menyimpan penerima ke dalam Saved Contacts pengirim
```

### Skenario 2: Transfer Bernilai Tinggi (High-Value AML Gate)
```gherkin
Given pengguna memiliki saldo dompet sebesar Rp 25.000.000
When pengguna mengirim saldo sebesar Rp 12.000.000 ke pengguna lain
Then sistem memotong saldo pengirim sebesar Rp 12.000.000
And menahan status transaksi menjadi 'pending_approval'
And transaksi muncul di antrean AdminTransferApprovalScreen
And saldo penerima BELUM bertambah hingga disetujui oleh Admin Kliring
```

### Skenario 3: Penolakan Withdrawal oleh Admin (Auto-Refund)
```gherkin
Given permohonan penarikan dana sebesar Rp 5.000.000 berstatus 'pending_approval' pada AdminWithdrawalApprovalScreen
When Admin menolak (reject) permohonan penarikan tersebut dengan alasan rekening tidak valid
Then status penarikan berubah menjadi 'rejected'
And sistem mengembalikan dana sebesar Rp 5.000.000 secara otomatis ke saldo dompet pengguna
```

---

## 7. Penutup & Handoff
Dokumen BRD versi 2.1.0 ini mengunci secara komprehensif 24 endpoints backend dan 25 antarmuka layar mobile sebagai acuan tunggal (*Single Source of Truth*) portofolio enterprise.
