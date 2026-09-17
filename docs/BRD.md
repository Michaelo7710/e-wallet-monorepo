# Business Requirement Document (BRD) — GreenPay E-Wallet Enterprise

---

## Kontrol Dokumen & Riwayat Revisi

| Atribut Dokumen | Informasi |
|:---|:---|
| **Nama Proyek** | GreenPay E-Wallet Enterprise Platform |
| **Kode Proyek** | `PRJ-GPAY-2026` |
| **Klien / Business Unit** | Showcase Portofolio Enterprise / Digital Banking Division |
| **Product Owner** | Senior Product Owner |
| **Technical Architecture Lead** | Principal Software Architect |
| **UI/UX Design Lead** | Principal Product Designer |
| **Versi Dokumen** | `v3.1.0` (Zero-Budget Architecture, Thematic Group Assets & Digital Receipt) |
| **Status Dokumen** | **APPROVED & BASELINED (READY FOR DOWNSTREAM EXECUTION)** |
| **Tanggal Pembaruan** | 16 September 2026 |
| **Dokumen Acuan Historis** | [`docs/BRD_AS_IS.md`](docs/BRD_AS_IS.md) *(Baseline v2.1.0 hasil reverse-engineering)* |

### Log Riwayat Perubahan

| Versi | Tanggal | Penulis | Ringkasan Perubahan | Status Persetujuan |
|:---|:---|:---|:---|:---|
| `v2.1.0` | 2026-09-16 | Product Owner | BRD As-Is berbasis kode sumber eksisting (24 API & 25 Screens). | Diarsipkan ([`docs/BRD_AS_IS.md`](docs/BRD_AS_IS.md)) |
| `v3.0.0` | 2026-09-16 | Senior Product Owner | Rekonstruksi 3 Pilar (Design, Business, User). Eliminasi disonansi visual Auth vs Dashboard, tiering limit, INVEST User Stories. | Terbit |
| `v3.1.0` | 2026-09-16 | Senior Product Owner | **Integrasi Kebijakan Zero-Budget (Rp 0)**, standarisasi **Thematic Group Backdrops** (4 grup fitur: Auth, User, Payment, Admin), perancangan aset **Emerald Platinum Wallet Card**, dan penambahan layar esensial **`TransactionDetailScreen.tsx` (Screen ke-26 / Digital Receipt)** untuk menggantikan dialog `Alert` mentah. | **Baselined & Approved** |

---

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary (Ringkasan Eksekutif)
**GreenPay E-Wallet Enterprise** adalah portofolio dompet digital kelas industri (*Enterprise Showcase*) yang dirancang untuk membuktikan standar rekayasa tertinggi (*Senior/Lead Level*) tanpa mengeluarkan biaya infrastruktur maupun desain (**Prinsip Anggaran Nol Rupiah / Rp 0 Budget**).

Dokumen versi `v3.1.0` ini menajamkan arah produk pada dua aspek vital:
1. **Penyempurnaan Pengalaman Visual Tematik:** Mengganti konsep latar foto berat monolitik dengan **Thematic Group Backdrops** (gradasi/vektor tematik ringan per kelompok fitur) serta aset kartu eksklusif **Emerald Platinum Wallet Card** yang memberikan kebanggaan visual bagi pengguna.
2. **Kelengkapan Siklus Transaksi FinTech:** Menghilangkan kecacatan alur transaksi saat ini di mana mutasi sukses hanya memunculkan dialog `Alert` sistem dan daftar riwayat mutasi tidak dapat diklik. Sistem dilengkapi dengan **`TransactionDetailScreen.tsx` (Digital Receipt)** interaktif yang dapat dibagikan.

### 1.2 Problem Statement & Analisis Kebutuhan Pembaruan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KONDISI SAAT INI (AS-IS)                         │
│  - Biaya: Potensi pembengkakan jika menggunakan API/aset berbayar.          │
│  - Desain Visual: Latar belakang Auth sangat berat (Auth-bg.png 4.2MB),     │
│    sementara fitur User, Payment, dan Admin berlatar putih datar tanpa      │
│    nuansa tematik pembawa ciri khas grup modul.                             │
│  - Komponen Kartu: Tampilan WalletCard masih dasar, belum memancarkan       │
│    kemewahan FinTech modern (tidak memiliki tekstur kartu & chip visual).   │
│  - Alur Transaksi: Transfer, Withdraw, dan TopUp berakhir pada popup teks   │
│    Alert bawaan OS. Di HistoryScreen, item transaksi tidak dapat diklik.    │
├─────────────────────────────────────────────────────────────────────────────┤
│                               KEBUTUHAN BARU                                │
│  1. [Prinsip Finansial]: Eksekusi 100% Zero-Budget (Rp 0).                  │
│  2. [Pembedaan Tematik]: Tiap grup modul memiliki identitas latar tematik   │
│     elegan tanpa membebani memori HP (<100KB atau procedural SVG).          │
│  3. [Aset Eksklusif]: Pembuatan tekstur Emerald Platinum Wallet Card.       │
│  4. [Layar Esensial]: Pembuatan TransactionDetailScreen.tsx (Screen #26)   │
│     sebagai tanda bukti transfer (struk) & rincian mutasi interaktif.       │
├─────────────────────────────────────────────────────────────────────────────┤
│                          KONDISI DIHARAPKAN (TO-BE)                         │
│  - Portofolio FinTech memukau berstandar Bank Digital (Revolut/Jenius).     │
│  - Transisi visual mulus dengan nuansa tematik 4 modul terkoordinasi.       │
│  - Siklus transaksi lengkap dari formulir, verifikasi PIN, hingga struk.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kebijakan Anggaran Nol Rupiah (*Zero-Budget Framework*)

Sebagai portofolio mandiri, seluruh keputusan arsitektural dan desain wajib mematuhi **Batas Anggaran Rp 0**:

| Komponen Proyek | Solusi Zero-Budget (Rp 0) | Jaminan Kualitas Enterprise |
|:---|:---|:---|
| **Pembuatan Aset Grafis** | Generasi lokal via AI Tool (`generate_image`), procedural code (`expo-linear-gradient`, `react-native-svg`), dan kompresi WebP. | Resolusi tajam, beban memori <100KB per aset, bebas royalti. |
| **Payment Gateway Sandbox** | Akun Midtrans Sandbox resmi (gratis tanpa limit waktu). | Mendukung simulasi BCA VA, Mandiri Bill, Permata, & QRIS. |
| **SMTP / Pengiriman OTP** | Mailtrap Free Tier / Ethereal Email (Virtual Inbox). | Simulasi verifikasi OTP email instan tanpa biaya SMS gateway. |
| **Database & Server** | MongoDB Local Docker Compose atau MongoDB Atlas M0 (Free Shared Cluster). | ACID Multi-document transactions aktif tanpa kartu kredit. |
| **Tipografi & Ikon** | Google Fonts (Inter / Plus Jakarta Sans) & `@expo/vector-icons`. | Tipografi standar industri dengan 100% lisensi terbuka (OFL). |

---

## 3. Thematic Visual Grouping & Asset Suite

> [!IMPORTANT]
> **Keputusan Produk terkait "Background Image Tiap Fitur":**  
> Meletakkan gambar foto *full-bleed* raster pada setiap layar operasional finansial (seperti form transfer dan tabel admin) adalah anti-pattern yang merusak keterbacaan teks angka (*readability*) dan melanggar standar WCAG 2.1.  
> **Rekomendasi Terbaik PO:** Mengadopsi **Thematic Group Ambient Backdrops**. Setiap grup modul memiliki jangkar visual tematik di area header atau latar belakang aksen halus berbasis gradasi/vektor beresolusi tinggi namun ringan (<100KB).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    4 TEMATIK VISUAL & ASET SPESIFIK GRUP                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. GRUP AUTH (features/auth): "The Vault Security"                          │
│    - Nuansa: Emerald Gelap Mewah + Aksen Kriptografi Halus.                 │
│    - Aset: Background mesh gradient teroptimasi (<80KB) menggantikan file   │
│      Auth-bg.png lama (4.2MB).                                              │
│                                                                             │
│ 2. GRUP USER (features/user): "Personal Wealth & Pride"                     │
│    - Nuansa: Soft Slate-Emerald Aura (#F8FAFC dengan aksen #047857).        │
│    - Aset Khusus: "Emerald Platinum Virtual Card" (Tekstur kartu mewah      │
│      dengan chip emas vektor, nomor kartu ter-masking, dan logo hologram).  │
│                                                                             │
│ 3. GRUP PAYMENT (features/payment): "Dynamic Flow & Speed"                  │
│    - Nuansa: Minty Emerald Wave (#10B981) yang memancarkan aksi cepat       │
│      dan forward momentum pada layar Top Up, Transfer, dan Penarikan.       │
│                                                                             │
│ 4. GRUP ADMIN (features/admin): "Executive Governance"                      │
│    - Nuansa: Deep Forest & Slate Grid yang memancarkan otoritas kepatuhan   │
│      dan kejelasan visual pembacaan angka audit.                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Spesifikasi Aset Baru yang Wajib Dibuat

| Nama File Aset | Lokasi Target | Dimensi / Format | Peran & Tampilan |
|:---|:---|:---:|:---|
| `auth-mesh-bg.webp` | `Wallet/src/assets/images/` | 1080x1920 (<80 KB) | Latar belakang modul Auth elegan tanpa beban cold-start. |
| `card-texture-platinum.png` | `Wallet/src/assets/images/` | 800x500 (<60 KB) | Tekstur kartu dompet digital premium dengan efek kilap hijau zamrud. |
| `pattern-payment-flow.png` | `Wallet/src/assets/images/` | 1080x400 (<40 KB) | Aksen header melengkung dinamis pada modul transaksi pembayaran. |
| `icon-chip-gold.png` | `Wallet/src/assets/images/` | 120x120 (<15 KB) | Ikon chip kartu pintar virtual untuk memperkuat kesan kartu debit asli. |

---

## 4. Penambahan Layar Esensial: `TransactionDetailScreen.tsx` (Screen #26)

### 4.1 Mengapa Layar Ini Mutlak Diperlukan?
Pada audit kode saat ini:
1. **Transfer Berhasil:** Memunculkan `Alert.alert` sederhana lalu kembali ke beranda. Pengguna tidak memiliki bukti transfer visual yang dapat ditunjukkan kepada penerima.
2. **Penarikan Berhasil:** Memunculkan `Alert.alert` tanpa rincian nomor referensi kliring.
3. **Riwayat Mutasi (`HistoryScreen.tsx`):** Baris transaksi memiliki event `onPress` kosong (`activeOpacity={0.7}` tanpa navigasi), sehingga pengguna tidak bisa melihat detail biaya admin, catatan, atau ID transaksi.

### 4.2 Spesifikasi Layar ke-26: `TransactionDetailScreen.tsx`
- **Lokasi Folder:** `Wallet/src/features/payment/screens/TransactionDetailScreen.tsx`
- **Rute Navigasi:** Ditambahkan ke `UserStackParamList` dengan nama `'TransactionDetail'`.
- **Anatomi Antarmuka (Digital Struk):**
  1. **Header Status Transaksi:** Ikon centang hijau animasi besar (*Success Animation*) atau ikon jam kuning (*Pending High-Value Approval*).
  2. **Nominal Utama:** Tipografi besar teks nominal transaksi (contoh: `Rp 250.000`).
  3. **Kartu Rincian Finansial (Paper Receipt Effect):**
     - Nomor Referensi Transaksi (dengan tombol *Copy to Clipboard*).
     - Tanggal & Waktu Presisi (Format: `16 Sep 2026, 17:30 WIB`).
     - Tipe Transaksi (Transfer P2P, Top Up Midtrans, Tarik Tunai).
     - Rincian Pengirim & Penerima (Nama, No. Telepon / Rekening Bank).
     - Biaya Admin Transaksi (`Rp 0` atau `Rp 4.500`).
     - Catatan Transaksi (*Notes*).
     - Status Kliring (`Berhasil` / `Menunggu Verifikasi Admin`).
  4. **Tombol Aksi Utama:**
     - **"Bagikan Struk":** Membuka dialog share bawaan ponsel (`Share.share`) berisi teks rincian transfer yang rapi.
     - **"Kembali ke Beranda":** Mengarahkan kembali ke `HomeScreen`.

---

## 5. Katalog Lengkap 26 Antarmuka Layar (*Complete Screen Catalog*)

Dengan ditetapkannya `TransactionDetailScreen.tsx`, struktur antarmuka aplikasi kini lengkap menjadi **26 Layar Mandiri**:

| No | File Layar (*Component*) | Modul | Nuansa Tematik Grup | Endpoint API Terkait |
|:---:|:---|:---|:---|:---|
| 1 | `RegisterScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-01` |
| 2 | `VerifyEmailScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-02` |
| 3 | `LoginScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-03` |
| 4 | `ForgotPasswordScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-06` |
| 5 | `ResetPasswordScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-07` |
| 6 | `TwoFactorAuthScreen.tsx` | `features/auth` | *Vault Security (Mesh Gradient)* | `AUTH-09` |
| 7 | `HomeScreen.tsx` | `features/user` | *Emerald Aura + Platinum Card* | `USER-01`, `PAY-05` |
| 8 | `ProfileScreen.tsx` | `features/user` | *Emerald Aura* | `USER-01`, `AUTH-05` |
| 9 | `SetupPinScreen.tsx` | `features/user` | *Emerald Aura* | `USER-02` |
| 10 | `ChangePasswordScreen.tsx` | `features/user` | *Emerald Aura* | `USER-03` |
| 11 | `ChangeEmailScreen.tsx` | `features/user` | *Emerald Aura* | `USER-04` |
| 12 | `ChangePinScreen.tsx` | `features/user` | *Emerald Aura* | `USER-05` |
| 13 | `TwoFactorSetupScreen.tsx` | `features/user` | *Emerald Aura* | `AUTH-08`, `AUTH-09` |
| 14 | `KycVerificationScreen.tsx` | `features/user` | *Emerald Aura (Tier Badge)* | `USER-06` |
| 15 | `HistoryScreen.tsx` | `features/user` | *Emerald Aura* | `PAY-05` |
| 16 | `TopUpScreen.tsx` | `features/payment` | *Dynamic Flow (Mint Accent)* | `PAY-01` |
| 17 | `SnapPaymentWebViewScreen.tsx` | `features/payment` | *Dynamic Flow (Midtrans Sandbox)* | `PAY-01`, `PAY-02` |
| 18 | `TransferScreen.tsx` | `features/payment` | *Dynamic Flow (Mint Accent)* | `PAY-04`, `USER-07` |
| 19 | `WithdrawScreen.tsx` | `features/payment` | *Dynamic Flow (Mint Accent)* | `PAY-03` |
| **20** | **`TransactionDetailScreen.tsx`** | **`features/payment`** | **Dynamic Flow (Receipt Mode)** | **`PAY-05` (Detail)** |
| 21 | `AdminDashboardScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-09` |
| 22 | `AdminBankManagementScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-01` |
| 23 | `AdminTopUpApprovalScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-02, 03, 04` |
| 24 | `AdminWithdrawalApprovalScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-05, 06` |
| 25 | `AdminTransferApprovalScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-07, 08` |
| 26 | `AdminFinancialReportScreen.tsx` | `features/admin` | *Executive Governance* | `ADM-09` |

---

## 6. Master MoSCoW Feature Matrix (v3.1.0)

| ID Fitur | Modul Sistem | Uraian Target Pembaruan | MoSCoW | Nilai Bisnis | Target Eksekutor |
|:---|:---|:---|:---:|:---:|:---|
| `FEAT-01` | Theme & Design | **Thematic Group Backdrops:** Penerapan latar tematik 4 modul dan kompresi `Auth-bg.png` (<80KB). | **Must-Have** | P0 (Kritis) | UI/UX Designer & Tech Architecture Lead |
| `FEAT-02` | Wallet Card | **Emerald Platinum Card Asset:** Desain tekstur kartu premium dengan chip virtual untuk dasbor `HomeScreen`. | **Must-Have** | P0 (Kritis) | UI/UX Designer & Frontend Developer |
| `FEAT-03` | Receipt & Detail| **TransactionDetailScreen (Screen #26):** Struk digital resmi pengganti dialog `Alert` mentah pasca-transaksi. | **Must-Have** | P0 (Kritis) | UI/UX Designer & Frontend Developer |
| `FEAT-04` | History Interaction | **Clickable History Items:** Menghubungkan klik baris transaksi di `HistoryScreen` ke `TransactionDetailScreen`. | **Must-Have** | P0 (Kritis) | Frontend Developer |
| `FEAT-05` | PIN Haptic Modal| **Haptic Security PIN Modal:** Validasi 6-digit PIN dengan animasi titik aman & getaran haptik. | **Must-Have** | P0 (Kritis) | Tech Architecture Lead & Frontend Developer |
| `FEAT-06` | Account Tiering | **Tiering Limit Enforcement:** Pembatasan mutasi: Reguler (Rp 2 Juta) vs KYC Verified (Rp 20 Juta). | **Must-Have** | P0 (Kritis) | Tech Architecture Lead & Backend Developer |
| `FEAT-07` | Midtrans Flow | **SNAP Fee Calculation:** Transparansi biaya admin pada checkout pembayaran Midtrans. | **Must-Have** | P1 (Tinggi) | Backend Developer |
| `FEAT-08` | Bell Navigation | **Header Notification Link:** Menghubungkan ikon lonceng notifikasi di `HomeScreen` ke modal riwayat notifikasi. | **Should-Have** | P1 (Tinggi) | Frontend Developer |
| `FEAT-09` | Share Feature | **Share Receipt Action:** Membagikan bukti struk transfer langsung ke aplikasi pihak ketiga (WhatsApp/Telegram). | **Should-Have** | P2 (Sedang) | Frontend Developer |
| `FEAT-10` | Offline Cache | **Local SQLite Ledger Cache:** Sinkronisasi mutasi transaksi saat jaringan terputus. | **Could-Have** | P2 (Sedang) | Tech Architecture Lead |

---

## 7. User Stories Terperinci untuk Fitur Baru

---

### User Story 03: `[US-PAY-003]` Penerbitan Struk Digital Transaksi & Rincian Mutasi
- **Parent Epic:** `Transaction Confirmation & Ledger Transparency`
- **Prioritas MoSCoW:** `Must-Have`
- **Story Points Estimasi:** `5`
- **PIC Rekayasa:** UI/UX Designer, Frontend Developer

#### Pernyataan Story
```text
Sebagai pengguna yang baru saja menyelesaikan transfer saldo atau mengecek mutasi,
Saya ingin melihat halaman struk digital resmi (TransactionDetailScreen) lengkap dengan nomor referensi dan rincian transaksi,
Agar saya memiliki bukti otentik yang dapat disimpan atau dibagikan kepada penerima dana.
```

#### Aturan Bisnis & Logika Validasi
1. Setelah transfer P2P, penarikan bank, atau top up selesai, sistem **dilarang** menutup alur dengan `Alert.alert` mentah; sistem **wajib** melakukan navigasi ke `TransactionDetailScreen`.
2. Halaman struk harus membedakan status transaksi secara visual: Hijau untuk "Berhasil", Kuning untuk "Menunggu Verifikasi Admin (AML)", dan Merah untuk "Gagal/Ditolak".
3. Pengguna yang menekan salah satu baris mutasi di `HistoryScreen` harus diarahkan ke `TransactionDetailScreen` dengan membawa parameter data transaksi terkait.

#### Kriteria Penerimaan (BDD / Gherkin Syntax)

##### Skenario 1: Transisi Mulus ke Struk Digital Pasca-Transfer (Happy Path)
```gherkin
Given pengguna telah mengonfirmasi transfer Rp 150.000 dengan PIN yang benar
 When pemrosesan transaksi di backend berhasil
 Then aplikasi TIDAK memunculkan popup Alert sistem
  And aplikasi langsung membuka TransactionDetailScreen dengan animasi mulus
  And layar menampilkan centang sukses hijau, nominal Rp 150.000, nama penerima, dan nomor referensi unik
  And tersedia tombol "Bagikan Struk" dan "Kembali ke Beranda".
```

##### Skenario 2: Membuka Rincian Transaksi dari Layar Riwayat (Navigation Path)
```gherkin
Given pengguna berada di HistoryScreen dan melihat daftar mutasi masa lalu
 When pengguna mengetuk salah satu kartu mutasi transaksi
 Then sistem membuka TransactionDetailScreen dengan data transaksi tersebut
  And seluruh data (tanggal, ID transaksi, nominal, tipe aliran dana) terisi akurat
  And pengguna dapat menekan tombol kembali untuk kembali ke daftar riwayat tanpa reload berulang.
```

##### Skenario 3: Membagikan Struk Transaksi (Share Path)
```gherkin
Given pengguna berada di TransactionDetailScreen berstatus sukses
 When pengguna menekan tombol "Bagikan Struk"
 Then sistem membuka antarmuka berbagi bawaan perangkat (native share sheet)
  And teks struk terformat rapi memuat ringkasan transaksi, tanggal, dan ID referensi.
```

---

## 8. Panduan Handoff Presisi untuk Downstream Skills

```
                             [BRD v3.1.0 Baselined]
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
 [ui-ux-designer]                                          [tech-architecture-lead]
 1. Desain 4 Thematic Backdrops:                           1. Perbarui UserStackParamList:
    - Auth: auth-mesh-bg (<80KB)                              - Tambahkan 'TransactionDetail'
    - User: card-texture-platinum (<60KB)                  2. Refaktor TransferScreen & WithdrawScreen:
    - Payment: pattern-payment-flow (<40KB)                   - Hapus Alert.alert mentah
    - Admin: pattern-admin-command                            - Navigasi ke TransactionDetailScreen
 2. Desain Layout TransactionDetailScreen.tsx              3. Pasang onPress di HistoryScreen
 3. Desain Komponen WalletCard Modern                      4. Terapkan Layout Thematic Container
```

### A. Panduan Spesifik untuk UI/UX Designer:
1. **Generasi Aset Nol Rupiah ([`Wallet/src/assets/images`](Wallet/src/assets/images)):**
   - Rancang tekstur kartu `card-texture-platinum.png` (800x500) berwarna hijau zamrud mewah dengan aksen emas untuk `WalletCard`.
   - Rancang backdrop ringan `auth-mesh-bg.webp` (<80KB) untuk menggantikan `Auth-bg.png` (4.2MB).
   - Rancang aksen grafis header melengkung `pattern-payment-flow.png` untuk modul pembayaran.
2. **Desain Layar ke-26 (`TransactionDetailScreen.tsx`):**
   - Rancang tampilan kertas struk digital (*digital voucher/receipt card*) dengan *jagged/perforated bottom edge* modern, tipografi nominal kontras tinggi, dan tombol *Action Share Sheet*.

### B. Panduan Spesifik untuk Tech Architecture Lead:
1. **Pembaruan Navigasi ([`UserStack.tsx`](Wallet/src/app/navigation/UserStack.tsx)):**
   - Daftarkan `TransactionDetail: { transaction: Transaction | any }` ke dalam `UserStackParamList`.
2. **Eliminasi Alert Primitif:**
   - Ubah callback `onSuccess` di [`TransferScreen.tsx`](Wallet/src/features/payment/screens/TransferScreen.tsx) dan [`WithdrawScreen.tsx`](Wallet/src/features/payment/screens/WithdrawScreen.tsx) agar memanggil `navigation.navigate('TransactionDetail', { transaction: tx })`.
3. **Aktivasi Klik Riwayat Mutasi:**
   - Hubungkan `onPress` pada `renderTransactionItem` di [`HistoryScreen.tsx`](Wallet/src/features/user/screens/HistoryScreen.tsx) ke rute `TransactionDetail`.
4. **Thematic Layout Architecture:**
   - Sediakan opsi prop varian tema (`variant="auth" | "user" | "payment" | "admin"`) pada layout pembungkus antarmuka.

---

## 9. Matriks Persetujuan (Sign-Off Matrix)

| Peran Tanggung Jawab | Entitas Pelaksana | Status | Catatan Validasi PO |
|:---|:---|:---:|:---|
| **Lead Product Owner** | Senior Product Owner (Product Owner) | **APPROVED** | Kebijakan Rp 0, 4 Aset Tematik, dan Layar Struk ke-26 resmi dikunci. |
| **UI/UX Design Lead** | Principal Designer (UI/UX Designer) | **READY** | Siap mengeksekusi aset kartu, backdrop tematik, dan mockup struk. |
| **Tech Architecture Lead** | Principal Architect (Tech Architecture Lead) | **READY** | Siap mengonfigurasi rute navigasi dan eliminasi Alert primitif. |
