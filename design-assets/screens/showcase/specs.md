# 🎨 Screen & Showcase Spec: Mobile UI/UX Gallery (README Showcase)

> **Modul:** `design-assets/screens/showcase`  
> **Komponen Target:** `README.md` (Section: Visual UI/UX & Architecture Showcase)  
> **Pendekatan Desain:** **Opsi A — Split-Card Feature Showcase (Dual-Column Standard)**  
> **Status:** 📐 Approved Specification (Ready for Documentation Integration)  
> **Versi:** 1.0.0 (Tier-1 Recruiter & FinTech Standard)  
> **Desainer:** Senior UI/UX Designer & Design System Architect  

---

## 1. Filosofi & Tujuan Desain (The 30-Second Recruiter Hook)

Tujuan utama dari galeri visual ini adalah membuktikan dalam waktu **30 detik pertama** kepada *Hiring Manager* dan *Technical Recruiter* bahwa GreenPay bukan sekadar aplikasi backend atau template generik, melainkan sistem perbankan/dompet digital nyata dengan:
1. **Desain Visual Kelas Dunia (*Emerald Elite Platinum*):** Micro-texture mewah, kontras WCAG 2.1 AA tinggi, dan komponen modular.
2. **Kepatuhan Privasi & Regulasi Nyata:** Penerapan visual masking data sensitif sesuai UU PDP dan perlindungan limit SSOT.
3. **Interaktivitas Moneter yang Tangguh:** Resi berstatus kanonikal server, voucher digital ber-notch perforasi, dan modal dialog pemblokir konkurensi.

---

## 2. Struktur Tata Letak 3 Kartu Pilar (Split-Card Architecture)

Setiap pilar disajikan dalam tabel 2 kolom responsif:
- **Kolom Kiri (380px):** Pratinjau Visual / Mockup Asset Framed.
- **Kolom Kanan:** Rincian Arsitektur, Kepatuhan Regulasi, Token Desain, dan Tautan Kode Terkait.

```
+-----------------------------------------------------------------------------------------------+
| [Kolom Kiri: Visual Mockup / Asset]     | [Kolom Kanan: Arsitektur & Kepatuhan FinTech]       |
|                                         |                                                     |
| (Gambar Aset Resolusi Tinggi Terbingkai)| • Pilar Keamanan & Rekayasa Perangkat Lunak         |
| • card-texture-platinum.png             | • Kepatuhan Regulasi (UU PDP, GDPR, PSD2)          |
| • auth-mesh-bg.png                      | • Token Semantik & Aksesibilitas WCAG 2.1 AA        |
| • pattern-payment-flow.png              | • Kontrak Data SSOT & Automated Test Evidence       |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. Rincian 3 Kartu Showcase Tematik

### 💎 Kartu 1: Emerald Elite Platinum Card & Tiered Balance Engine
- **Visual Asset:** [`design-assets/exports/card-texture-platinum.png`](../../../design-assets/exports/card-texture-platinum.png)
- **Elemen Desain:**
  - Tekstur Guilloche Emas 24k berlatar belakang hijau zamrud (*Deep Forest Emerald* `#022c22` ➔ `#047857`).
  - Chip EMV perak mengkilap, indikator nirkabel NFC, dan logo *GreenPay Platinum*.
  - Saldo dengan tombol toggle mata (*eye toggle*) untuk privasi visual di ruang publik.
  - Badge KYC emas: `PLATINUM KYC` (Plafon Rp 50.000.000) vs `REGULER TIER` (Plafon Rp 5.000.000).
- **Keunggulan Teknis & Kepatuhan:**
  - Penyelarasan limit saldo 100% Single Source of Truth (SSOT) dengan `paymentService.js`.
  - Zero-lag render dengan memoized layout pada React Native.

---

### 🧾 Kartu 2: Authoritative Digital Receipt Voucher (Screen #26)
- **Visual Architecture:** Voucher Struk Digital Berlubang (*Perforated Ticket Notches*).
- **Elemen Desain:**
  - **Notch Perforasi:** Lingkaran pemotong setengah lingkaran kiri-kanan dengan garis putus-putus (*dashed line*) bergaya tiket teater klasik.
  - **Status Header:** Ikon centang hijau emerald bersinar, teks *"Transaksi Berhasil"*, dan nominal tebal format Rupiah (`Rp 150.000`).
  - **Masking Data Sensitif (UU PDP):** Rekening bank dimasking menjadi `******1234` dan nomor ponsel dimasking menjadi `0812****8901`.
  - **Strict Server Verification:** Label stempel kanonikal server. Banner oranye penolakan otomatis tampil jika nomor referensi server tidak terverifikasi, disertai penonaktifan tombol share.
- **Keunggulan Teknis & Kepatuhan:**
  - Eliminasi 100% nomor dummy client (`GP-TRX-*`).
  - Payload native share (`Share.share`) teruji steril dari kebocoran data plain-text.

---

### 🛡️ Kartu 3: Zero-Trust Security & Multi-Factor Authentication
- **Visual Asset:** [`design-assets/exports/auth-mesh-bg.png`](../../../design-assets/exports/auth-mesh-bg.png) & [`design-assets/exports/pattern-payment-flow.png`](../../../design-assets/exports/pattern-payment-flow.png)
- **Elemen Desain:**
  - Gradien mesh modern berukuran sangat ringan (memangkas cold-start lag hingga 87%).
  - Pola aliran data moneter geometris berulang untuk layar transaksi transfer & penarikan.
  - Form verifikasi 2FA TOTP (Google Authenticator), biometrik FaceID/Fingerprint prompt.
  - Modal dialog interaktif pemblokir kegagalan moneter (`GlobalDialogModal.tsx`) dengan lock `isProcessing`.
- **Keunggulan Teknis & Kepatuhan:**
  - Strong Customer Authentication (PSD2 RTS SCA) untuk transfer bernilai tinggi.
  - Anti-brute force, device root integrity check, dan SSL pinning.

---

## 4. Snippet Markdown Siap Pakai (Untuk README.md)

Berikut adalah blok kode Markdown/HTML yang siap diintegrasikan langsung ke dalam `README.md` pada `TASK-DOC-01`:

```markdown
## 📱 Antarmuka Pengguna & Galeri Showcase (Visual UI/UX Showcase)

GreenPay mengusung bahasa desain **"Emerald Elite"** — menggabungkan kemewahan estetika perbankan privat (*Private Banking*) dengan kecepatan interaksi modern, kontras rasio WCAG 2.1 AA tinggi, dan komponen modular berbasis Server-Driven UI (SDUI).

---

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
        <li><b>Optimasi Aset Nol-Rupiah:</b> Mengganti aset bitmap lama (4.2MB) menjadi mesh gradien terkompresi (540KB) untuk melenyapkan cold-start freeze pada perangkat low-end.</li>
        <li><b>Multi-Factor Authentication (2FA):</b> Gerbang TOTP mandiri dengan SHA-1/CSPRNG token dan QR-Code provisioning.</li>
        <li><b>Unified 3-Tier Feedback:</b> Eliminasi 100% <code>Alert.alert</code> sistem. Kegagalan moneter dikunci menggunakan modal dialog pemblokir ber-ID unik (<code>GlobalDialogModal.tsx</code>) yang kebal <i>race condition</i>.</li>
        <li><b>Pola Aliran Pembayaran:</b> Aset latar geometris <code>pattern-payment-flow.png</code> memberikan kepastian visual saat pengguna berada di alur kritis mutasi dana.</li>
      </ul>
      <p>🔗 <i>Komponen: <code>Wallet/src/shared/layouts/AuthLayout.tsx</code> & <code>GlobalDialogModal.tsx</code></i></p>
    </td>
  </tr>
</table>
```

---

## 5. Design Decision Record (DDR-UI-04)

- **Keputusan:** Menggunakan Opsi A (Dual-Column Split Showcase) daripada galeri panorama 4 kartu sebaris.
- **Rasional:** Technical Recruiter dan Engineering Manager membutuhkan konteks teknis di samping visual. Tabel 2 kolom memberikan ruang seimbang antara daya tarik estetika dan bukti arsitektur (Clean Architecture, UU PDP, SSOT).
- **Aksesibilitas (WCAG 2.1 AA):** Semua teks di dalam mockup menggunakan warna kontras tinggi dengan rasio minimal 4.5:1 terhadap latar belakang.
