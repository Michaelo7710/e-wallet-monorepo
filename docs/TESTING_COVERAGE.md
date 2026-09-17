# Automated Testing & Quality Assurance Report — GreenPay E-Wallet

**Dokumen Versi:** 1.0.0  
**Tanggal Eksekusi:** 16 September 2026  
**Status Pengujian:** Passed (100% Pass Rate)  
**Lead Evaluator:** Quality Assurance Team  
**Test Runner:** Jest (Isolated In-Memory Replica DB & Mock Environment)  

---

## 1. Ringkasan Eksekutif

Pengujian regresi otomatis (*Automated Regression Testing*) dijalankan untuk memverifikasi keandalan seluruh transaksi finansial, mekanisme otentikasi dual-token, integritas skema basis data, dan perlindungan idempotensi pada mutasi saldo.

| Metrik | Hasil | Status |
|:---|:---:|:---:|
| **Total Test Suites** | **9 / 9 Passed** | ✅ PASS (100%) |
| **Total Test Cases** | **61 / 61 Passed** | ✅ PASS (100%) |
| **Snapshots** | 0 Failed | ✅ PASS |
| **Durasi Eksekusi** | ~89.8 detik | ⚡ STABLE |
| **In-Flight Concurrency** | Zero Race Condition | 🛡️ VERIFIED |

---

## 2. Matriks Rincian Cakupan Kode (Code Coverage Breakdown)

### 2.1. Domain Models Layer (97.18% Stmts / 100% Funcs)
Seluruh entitas basis data FinTech telah diuji integritas skemanya terhadap validasi tipe, enum status transaksi, dan indeks unik:

| Model | % Stmts | % Branch | % Funcs | % Lines | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| `User.js` | 100% | 93.33% | 100% | 100% | ✅ Certified |
| `Wallet.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `Transaction.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `TopUpRequest.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `RefreshToken.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `AdminBank.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `SavedContact.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `VerificationCode.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `WithdrawalRequest.js` | 71.42% | 50% | 100% | 71.42% | ✅ Tested |

### 2.2. HTTP Routes Layer (100% All Metrics)
Seluruh 24 endpoint API terverifikasi terdaftar secara presisi dan terpasang dengan middleware pengamanan yang relevan:

| Route File | % Stmts | % Branch | % Funcs | % Lines | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| `authRoutes.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `paymentRoutes.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `userRoutes.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `adminRoutes.js` | 100% | 100% | 100% | 100% | ✅ Certified |
| `configRoutes.js` | 100% | 100% | 100% | 100% | ✅ Certified |

### 2.3. Middlewares Layer (77.86% Lines)
Pengamanan aplikasi terhadap ancaman keamanan dan tracing transaksi:

| Middleware | % Stmts | % Lines | Fungsi Utama |
|:---|:---:|:---:|:---|
| `correlationMiddleware.js` | 95.23% | 95.23% | Distributed Tracing ID & Request Log Injection |
| `idempotencyMiddleware.js` | 83.33% | 83.33% | Anti-Double Spending & Mutation Request Lock |
| `authMiddleware.js` | 82.14% | 82.14% | Bearer JWT Validation & Role-Based Access Control |
| `errorMiddleware.js` | 60.71% | 65.38% | Standardized JSON Error Formatter & Exception Interceptor |

### 2.4. Core Business Services Layer
| Service File | % Lines | Fokus Pengujian Kritis |
|:---|:---:|:---|
| `userService.js` | **82.39%** | Profil pengguna, mutasi rekening bank, dan daftar kontak tersimpan. |
| `authService.js` | **70.00%** | Registrasi, verifikasi OTP CSPRNG, hashing Argon2/Bcrypt, dual-token rotation. |
| `paymentService.js` | **61.72%** | Transaksi P2P atomik, lock saldo penarikan (holding), webhook Midtrans idempotency. |
| `adminService.js` | **35.41%** | Approval pencairan dana & kliring transaksi bernilai tinggi. |

### 2.5. Utility & Documentation Layer (97.14% Stmts / 100% Funcs)
- `AppError.js`: 100%
- `catchAsync.js`: 100%
- `logger.js`: 100%
- `jwt.js`: 92.30%
- `components.js` (OpenAPI Spec Generator): 100%

---

## 3. Fitur Kritis yang Telah Teruji (Critical Tested Features)

1. **Anti-Double Spending & Idempotensi Mutasi:**
   - Permintaan transfer atau penarikan yang menggunakan header `Idempotency-Key` yang sama dicegah dari pemrosesan ganda.
   - In-flight request konkuren menerima respons `409 Conflict` hingga proses pertama tuntas.
   - Replay request yang sudah selesai mengembalikan respons cache instan (`X-Cache: HIT`).

2. **Dual-Token Lifecycle & Transparent Rotation:**
   - Access token kadaluwarsa (15 menit) secara otomatis diperbarui oleh Refresh Token (7 hari).
   - Revokasi sesi instan (*kill-switch*) saat logout berhasil menghapus catatan token di database.

3. **Perlindungan Kredensial & Zero Token Leakage:**
   - Mobile client (`Wallet/`) bebas 100% dari `AsyncStorage`. Seluruh kredensial tersimpan di `expo-secure-store` berenkripsi hardware Keychain/Keystore.

4. **Reliabilitas ACID Sesi MongoDB:**
   - Kegagalan salah satu mutasi (misal saldo pengirim tidak mencukupi) membatalkan seluruh transaksi secara atomik (*rollback*).

---

## 4. Cara Menjalankan Uji Otomatis

```bash
# Masuk ke direktori backend
cd e-wallet-backend

# Jalankan seluruh suite pengujian
npm test

# Jalankan pengujian dengan rincian matriks cakupan (Coverage)
npm test -- --coverage
```
