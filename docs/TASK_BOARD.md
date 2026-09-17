# 📋 Master Task Board — GreenPay E-Wallet & AGY Ecosystem

> **Aturan Tetap (Kekekalan Tugas):** Seluruh tugas di bawah ini **HANYA BOLEH DIUBAH MENJADI `[DONE]` ATAU DIHAPUS** jika telah diverifikasi secara konkret dengan laporan keberhasilan (bukti file, audit lulus, atau uji tes hijau).  
> **Terakhir Diperbarui:** 17 September 2026 | **Pengawas:** `personal-assistant-agy`

---

## 📊 Ringkasan Status Tugas

| Total Tugas Terdaftar | 🟢 Selesai Terverifikasi (DONE) | 🟡 Dikerjakan (IN_PROGRESS) | 🔴 Menunggu (TODO) |
|:---:|:---:|:---:|:---:|
| **20** | **20** | **0** | **0** |


---

## 🗂️ Bagian A: Papan Tugas Proyek Aplikasi (Wallet App)

| ID Task | Asal Delegasi | Pelaksana Target | Deskripsi Tugas & Target File | Status | Bukti Keberhasilan / Verifikasi |
|:---|:---|:---|:---|:---:|:---|
| `TASK-PO-01` | `product-owner` | `product-owner` | Rekonstruksi BRD v3.1.0: Zero-budget policy, 4 thematic backdrops, dan spesifikasi Screen #26. | 🟢 **DONE** | [`docs/BRD.md`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/docs/BRD.md) v3.1.0 terbit & baseline disetujui. |
| `TASK-UI-01` | `ui-ux-designer` | `ui-ux-designer` | Scaffolding `design-assets/`, token warna *Emerald Elite* (`colors.json`), dan ekspor CSV. | 🟢 **DONE** | [`design-requirements.csv`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/design-assets/design-requirements.csv) & `design-audit.js` skor 100%. |
| `TASK-UI-02` | `ui-ux-designer` | `ui-ux-designer` | Generasi aset visual nol rupiah: `card-texture-platinum.png`, `auth-mesh-bg.png`, dan `pattern-payment-flow.png`. | 🟢 **DONE** | Aset terpasang di [`Wallet/src/assets/images/`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/assets/images/). |
| `TASK-UI-03` | `ui-ux-designer` | `ui-ux-designer` | Spesifikasi antarmuka Screen #26 (`TransactionDetailScreen`), `HomeScreen`, dan `AuthLayout`. | 🟢 **DONE** | File spesifikasi lengkap di [`design-assets/screens/`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/design-assets/screens/). |
| `TASK-ARCH-01` | Diskusi User | `tech-architecture-lead` | **Arsitektur Unified Feedback (3-Tier):** Implementasi `feedback.service.ts`, `GlobalDialogModal.tsx`, `GlobalToast.tsx`, dan Provider di root navigator. | 🟢 **DONE** | [`core/feedback/`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/core/feedback/), [`GlobalFeedbackProvider.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/shared/components/GlobalFeedbackProvider.tsx), mounted di [`AppNavigator.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/app/navigation/AppNavigator.tsx), compile tsc code 0. |
| `TASK-ARCH-02` | `product-owner` | `tech-architecture-lead` | **Registrasi Navigasi Screen #26:** Daftarkan `TransactionDetail` ke `UserStackParamList` di [`UserStack.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/app/navigation/UserStack.tsx). | 🟢 **DONE** | Terdaftar di [`UserStack.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/app/navigation/UserStack.tsx), TypeScript validasi clean. |
| `TASK-ARCH-03` | `product-owner` | `tech-architecture-lead` | **Penyambungan Alur Transaksi:** Ubah callback `TransferScreen.tsx` dan `WithdrawScreen.tsx` agar membuka `TransactionDetailScreen` (eliminasi `Alert.alert`). | 🟢 **DONE** | Callback onSuccess di [`TransferScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/payment/screens/TransferScreen.tsx) & [`WithdrawScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/payment/screens/WithdrawScreen.tsx) bernavigasi ke `TransactionDetail`. |
| `TASK-ARCH-04` | `ui-ux-designer` | `tech-architecture-lead` | **Aktivasi Klik Riwayat:** Pasang `onPress` pada baris transaksi di [`HistoryScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/user/screens/HistoryScreen.tsx) untuk membuka rincian di `TransactionDetailScreen`. | 🟢 **DONE** | `onPress` terpasang di [`HistoryScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/user/screens/HistoryScreen.tsx), navigasi membawa payload `Transaction`. |
| `TASK-ARCH-05` | `ui-ux-designer` | `tech-architecture-lead` | **Implementasi Screen #26:** Coding komponen `TransactionDetailScreen.tsx` (Voucher struk digital dengan tombol Share native & Clipboard copy). | 🟢 **DONE** | [`TransactionDetailScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/payment/screens/TransactionDetailScreen.tsx) terimplementasi & tsc compile clean. |
| `TASK-ARCH-06` | `ui-ux-designer` | `tech-architecture-lead` | **Pembaruan Kartu Dompet:** Refaktor [`WalletCard.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/shared/components/WalletCard.tsx) menggunakan aset baru `card-texture-platinum.png` dan chip EMV. | 🟢 **DONE** | [`WalletCard.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/shared/components/WalletCard.tsx) mengonsumsi texture guilloche emas & badge KYC. |
| `TASK-ARCH-07` | `ui-ux-designer` | `tech-architecture-lead` | **Harmonisasi Auth:** Perbarui [`AuthLayout.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/shared/layouts/AuthLayout.tsx) menggunakan aset ringan `auth-mesh-bg.png` (memangkas aset lama 4.2MB hingga 87%). | 🟢 **DONE** | [`AuthLayout.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/shared/layouts/AuthLayout.tsx) mengonsumsi `auth-mesh-bg.png`, memangkas cold-start lag. |
| `TASK-QA-01` | `personal-assistant-agy` | `qa-engineer` | **Automated Unit & Integration Test:** Penulisan test suite untuk feedback store/service ([`feedback.service.ts`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/core/feedback/feedback.service.ts)) dan pengujian interaksi layar struk digital ([`TransactionDetailScreen.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/src/features/payment/screens/TransactionDetailScreen.tsx)). | 🟢 **DONE** | Lulus pengujian otomatis Jest (2 test suite, 21 assertions pass: [`feedbackService.test.ts`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/__tests__/feedbackService.test.ts) & [`transactionDetailScreen.test.tsx`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/__tests__/transactionDetailScreen.test.tsx)). |
| `TASK-FE-01` | `personal-assistant-agy` | `frontend-developer` | **Sweeping Migrasi Feedback Sekunder:** Refaktor eliminasi raw `Alert.alert` pada seluruh flow sekunder (Ganti Password, Ganti PIN, Ganti Email, KYC Verification) beralih ke `feedback.toast` dan `feedback.dialog`. | 🟢 **DONE** | Seluruh flow sekunder dan seluruh screen (Ganti Sandi, PIN, Email, KYC, Profile, Auth, Admin, Payment) 100% bebas dari `Alert` (0 match ripgrep di `Wallet/src`), dan kompilasi TypeScript `tsc --noEmit` exit code 0. |
| `TASK-DEVOPS-01` | `personal-assistant-agy` | `devops-engineer` | **Pencegahan Regresi Raw Alert:** Konfigurasi script linting / CI static guard atau custom ESLint rule untuk memblokir import dan penggunaan `Alert.alert` secara permanen di masa depan. | 🟢 **DONE** | Script audit CI guard ([`scripts/ci/guard-anti-alert.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/scripts/ci/guard-anti-alert.js)) memindai 108 berkas dengan exit code 0, ESLint rule `no-restricted-imports` aktif di [`.eslintrc.js`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/.eslintrc.js), test suite Jest lulus ([`antiAlertGuard.test.ts`](file:///C:/Users/latih/ReactNativeApp/Wallet_App/Wallet/__tests__/antiAlertGuard.test.ts), 3 assertions pass), dan kompilasi TypeScript `tsc --noEmit` exit code 0. |

---

## 🗂️ Bagian B: Papan Tugas Peningkatan Ekosistem Skill AGY (Batch 3 Upgrade)

| ID Task | Asal Delegasi | Pelaksana Target | Deskripsi Tugas Peningkatan Skill | Status | Kriteria Verifikasi Lulus (DoD) |
|:---|:---|:---|:---|:---:|:---|
| `TASK-SKILL-01` | `personal-assistant-agy` | `skill-creator` | **Upgrade `product-owner`:** Harmonisasi format BRD agar terintegrasi langsung dengan dekomposisi task `personal-assistant-agy` + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (8 lulus, 0 warning, 0 error), SKILL.md 86 baris, BLUEPRINT.md & handshake protocol disetujui, dan tersinkronisasi ke Obsidian. |
| `TASK-SKILL-02` | `personal-assistant-agy` | `skill-creator` | **Upgrade `brand-strategist`:** Migrasi import skrip `scripts/init-brand-assets.js` ke modul native `node:fs` & `node:path` + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (9 lulus, 0 warning, 0 error), import modul native `node:fs`/`node:path` zero-dependency, BLUEPRINT.md disetujui, dan tersinkronisasi ke Obsidian. |
| `TASK-SKILL-03` | `personal-assistant-agy` | `skill-creator` | **Upgrade `conversion-copywriter`:** Standarisasi batasan karakter iklan (Meta, Google, TikTok) + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (8 lulus, 0 warning, 0 error), batasan karakter multi-platform terstandarisasi, SKILL.md 81 baris, BLUEPRINT.md disetujui, dan tersinkronisasi ke Obsidian. |
| `TASK-SKILL-04` | `personal-assistant-agy` | `skill-creator` | **Upgrade `funnel-architect`:** Standarisasi framework alokasi budget TOFU/MOFU/BOFU + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (9 lulus, 0 warning, 0 error), rasio budget industri 60/20/20 & 40/30/30 ditanam, zero-dependency script clean, BLUEPRINT.md disetujui, dan tersinkronisasi ke Obsidian. |
| `TASK-SKILL-05` | `personal-assistant-agy` | `skill-creator` | **Upgrade `growth-data-analyst`:** Standarisasi audit CSV metrik iklan & protokol keputusan Kill/Scale/Optimize + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (8 lulus, 0 warning, 0 error), aturan kuantitatif Kill/Scale/Optimize ditanam, SKILL.md 84 baris, BLUEPRINT.md disetujui, dan tersinkronisasi ke Obsidian. |
| `TASK-SKILL-06` | `personal-assistant-agy` | `skill-creator` | **Upgrade `seo-content-specialist`:** Standarisasi pedoman Google E-E-A-T & guardrail hardware-safe + formula anti-undertriggering description. | 🟢 **DONE** | Lulus `lint-skill.mjs` (8 lulus, 0 warning, 0 error), pedoman E-E-A-T & on-page snippet limits ditanam, SKILL.md 84 baris, BLUEPRINT.md disetujui, dan tersinkronisasi ke Obsidian. |

---

## 🚀 Panduan Eksekusi Tugas Cepat (Quick Invocation Guide)

Untuk memanggil eksekusi tugas berikutnya langsung dengan skill bersangkutan, Anda dapat memberikan perintah:

1. **Eksekusi Pengujian Otomatis (`qa-engineer`):**
   > *"Gunakan skill qa-engineer untuk mengeksekusi TASK-QA-01."*
2. **Eksekusi Pembersihan Kode & Migrasi Notifikasi (`frontend-developer`):**
   > *"Gunakan skill frontend-developer untuk mengeksekusi TASK-FE-01."*
3. **Eksekusi Linter & Guard Anti-Regresi (`devops-engineer`):**
   > *"Gunakan skill devops-engineer untuk mengeksekusi TASK-DEVOPS-01."*
4. **Eksekusi Lanjutan Upgrade Skill Batch 3 (`skill-creator`):**
   > *"Lanjutkan upgrade Batch 3 mulai dari TASK-SKILL-01."*
