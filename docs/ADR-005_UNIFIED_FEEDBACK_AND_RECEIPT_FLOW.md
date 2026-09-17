# Architecture Decision Record (ADR-005): Unified Feedback System & Digital Transaction Receipt Flow

---

## Status
**ACCEPTED & IMPLEMENTED** (16 September 2026)

## Pemangku Kepentingan
- Principal Mobile Architect
- Senior UI/UX Designer
- Senior Product Owner

---

## Konteks & Pernyataan Masalah
Sebelum pembaruan ini, antarmuka mobile `Wallet_App` mengandalkan pemanggilan dialog bawaan sistem operasi (`Alert.alert`) di lebih dari 95 titik kode. Dialog native tersebut memiliki kelemahan arsitektural:
1. Menimbulkan disonansi visual ekstrem (mengabaikan token tema *Emerald Elite* `#047857` dan radius sudut).
2. Hasil mutasi moneter (Transfer sukses, Penarikan berhasil) hanya ditampilkan melalui dialog teks sederhana tanpa struk resmi.
3. Daftar transaksi pada `HistoryScreen` tidak memiliki interaktivitas untuk membuka rincian bukti transaksi.
4. Muncul *modal fatigue* pada pengguna akibat popup pemblokir layar untuk notifikasi sepele.

---

## Keputusan Arsitektur
Ditetapkan **Taksonomi 3-Tier Feedback FinTech** dengan arsitektur imperatif berbasis Zustand:

1. **Tier 1 — Transient Notification (Branded Toast):**
   - Komponen: `GlobalToast.tsx`
   - Store: `feedback.store.ts` via helper `feedback.toast.show(message, type)`
   - Sifat: Non-blocking, auto-dismiss 3 detik, melayang di atas safe-area dengan warna semantik.
2. **Tier 2 — Decision & Confirmation (Branded Dialog Modal):**
   - Komponen: `GlobalDialogModal.tsx`
   - Store: `feedback.store.ts` via helper `feedback.dialog.confirm({ title, message, onConfirm })`
   - Sifat: Blocking modal elegan dengan kartu beradius 24px, ikon semantik bertema, dan proteksi aksi destruktif.
3. **Tier 3 — Monetary Flow (Digital Receipt Screen):**
   - Komponen: `TransactionDetailScreen.tsx` (Screen ke-26 di `features/payment/screens/`)
   - Rute Navigasi: `'TransactionDetail'` terdaftar di `UserStackParamList`.
   - Menampilkan voucher struk berpori, tombol salin ID referensi, dan tombol native share sheet (`Share.share`).

---

## Konsekuensi & Dampak Teknis
- **Positif:** 
  - Tidak ada lagi dialog native yang memutus pengalaman visual merek.
  - Alur transaksi perbankan lengkap dari form, input PIN dengan haptic, hingga penerbitan struk.
  - Zero-budget: Memanfaatkan library yang sudah terinstal (`zustand`, `expo-clipboard`, `expo-linear-gradient`).
- **Verifikasi Kualitas:**
  - TypeScript compiler checking lulus 100% tanpa error (`tsc --noEmit` exit code 0).
