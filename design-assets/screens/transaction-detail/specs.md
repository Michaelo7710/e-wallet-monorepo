# Screen Spec: TransactionDetailScreen (Screen #26 — Digital Receipt)

> **Modul:** `features/payment`  
> **Komponen:** `TransactionDetailScreen.tsx`  
> **Status:** 📐 Approved Specification (Ready for Frontend Coding)  
> **Versi:** 1.0.0 (Zero-Budget FinTech Experience)  
> **Desainer:** Senior UI/UX Designer  

---

## 1. Layout Architecture (100% Auto Layout / Flexbox)

```
[Root: Vertical, Fill, bg: sys/bg/canvas, SafeArea]
├── [AmbientHeader: Vertical, Fill-H, h:180px, bg: ThematicGradient #047857 -> #10B981]
│   ├── [TopNavBar: Horizontal, Fill-H, h:56px, p:16, align:center]
│   │   ├── [BackButton: TouchTarget 48x48, icon: arrow-back, color: #FFFFFF]
│   │   ├── [ScreenTitle: Fill-H, text: "Bukti Transaksi", align:center, color: #FFFFFF]
│   │   └── [ShareButton: TouchTarget 48x48, icon: share-social-outline, color: #FFFFFF]
│   └── [StatusBadgeContainer: Vertical, center, mt:8]
│       ├── [StatusIconBubble: 64x64, circle, bg: #FFFFFF, shadow: soft]
│       │   └── [Icon: checkmark-circle (success:#10B981) / time (warning:#F59E0B)]
│       └── [StatusLabel: Typography.h3, color: #FFFFFF, "Transaksi Berhasil"]
│
├── [ScrollViewContainer: Vertical, Fill, scroll, px:20, -mt:32]
│   │
│   └── [ReceiptCard: Vertical, Fill-H, bg: sys/bg/surface (#FFFFFF), radius:20, shadow:lg, p:20]
│       ├── [AmountHeaderSection: Vertical, center, py:16]
│       │   ├── [AmountLabel: Typography.caption, color: sys/text/muted, "Total Transaksi"]
│       │   └── [AmountValue: Typography.display (28px/Bold), color: sys/text/primary, "Rp 250.000"]
│       │
│       ├── [PerforatedDivider: Horizontal, Fill-H, h:24, relative, overflow:hidden]
│       │   ├── [LeftNotch: Circle 16x16, bg: sys/bg/canvas, -left:8]
│       │   ├── [DashedLine: 1px borderDashed, color: sys/border/default]
│       │   └── [RightNotch: Circle 16x16, bg: sys/bg/canvas, -right:8]
│       │
│       ├── [MetadataSection: Vertical, Fill-H, py:12, gap:12]
│       │   ├── [Row/Type: Title "Jenis Transaksi" <-> Value "Transfer Saldo (P2P)"]
│       │   ├── [Row/Recipient: Title "Penerima" <-> Value "0812-3456-7890 (Budi Pratama)"]
│       │   ├── [Row/Sender: Title "Pengirim" <-> Value "Arya Raditya"]
│       │   ├── [Row/RefId: Title "Nomor Referensi" <-> Value "GP-TRX-20260916-9042" + CopyBtn]
│       │   ├── [Row/Time: Title "Waktu Transaksi" <-> Value "16 Sep 2026, 17:42 WIB"]
│       │   ├── [Row/Fee: Title "Biaya Layanan" <-> Value "Rp 0 (Gratis)"]
│       │   └── [Row/Notes: Title "Catatan" <-> Value "Patungan makan siang"]
│       │
│       └── [SecuritySealSection: Horizontal, center, py:12, gap:8, borderTop: 1px solid #F1F5F9]
│           ├── [ShieldIcon: 16x16, color: sys/brand/primary (#047857)]
│           └── [SecurityText: 11px, color: sys/text/muted, "Transaksi aman terenkripsi TLS 1.3 & Bank-Grade SLA"]
│
└── [StickyBottomBar: Vertical, Fill-H, bg: sys/bg/surface, p:16, borderTop: 1px solid #E2E8F0]
    ├── [Button/ShareReceipt: Primary, Fill-H, h:50, radius:12, bg: sys/brand/primary, "Bagikan Bukti Transfer"]
    └── [Button/BackHome: Ghost, Fill-H, h:44, center, mt:8, text: "Kembali ke Beranda"]
```

---

## 2. Component Requirements & SDUI Taxonomy

| Component ID | SDUI Taxonomy | State Matrix | Tokens Applied | A11y Requirement |
|:---|:---|:---|:---|:---|
| `Receipt_Status_Header` | `Widget/StatusHeader` | `success`, `pending_aml`, `failed` | bg: sys/brand/primary, icon: semantic | `accessibilityRole="header"` |
| `Receipt_Amount_Display` | `Atom/TextDisplay` | `loaded`, `skeleton` | text: sys/text/primary | High contrast ratio 12:1 |
| `Receipt_Ref_Copy` | `Molecule/CopyButton` | `default`, `copied`, `active` | border: sys/border/default | Touch target 48x48px |
| `Receipt_Action_Share` | `Molecule/Button` | `default`, `pressed`, `loading` | bg: sys/brand/primary, text: #FFF | `accessibilityRole="button"` |
| `Receipt_Action_Home` | `Molecule/Button` | `default`, `pressed` | text: sys/brand/primary | `accessibilityRole="button"` |

---

## 3. Semantic Token Mapping

- **Kanvas Luar:** `sys/bg/canvas` (`#F8FAFC`)
- **Kartu Voucher:** `sys/bg/surface` (`#FFFFFF`)
- **Header Gradasi:** `thematic/payment/header-gradient-start` (`#047857`) ke `thematic/payment/header-gradient-end` (`#10B981`)
- **Teks Utama:** `sys/text/primary` (`#0F172A`)
- **Teks Sekunder:** `sys/text/secondary` (`#475569`)
- **Teks Pudar/Label:** `sys/text/muted` (`#64748B`)
- **Garis Pembatas Berpori:** `sys/border/default` (`#E2E8F0`)
- **Tombol Utama (Share):** `sys/action/primary` (`#047857`, hover `#065F46`)

---

## 4. Acceptance Criteria & Quality Gates

- [x] **Zero Raw Alerts:** Alur transfer, withdraw, dan top-up langsung bernavigasi ke layar ini tanpa popup teks OS.
- [x] **History Item Clickable:** Mengetuk baris mutasi di `HistoryScreen` membuka layar ini dengan parameter mutasi lengkap.
- [x] **Touch Target Safety:** Seluruh tombol navigasi, copy ID, dan CTA share memiliki ukuran minimal 48x48 dp.
- [x] **Clipboard Instant Feedback:** Mengetuk tombol copy nomor referensi menampilkan pesan toast/animasi centang "Tersalin!".
- [x] **Native Sharing Integration:** Mengetuk "Bagikan Bukti Transfer" memicu `Share.share` dengan payload teks terformat rapi.
- [x] **WCAG AA Compliance:** Rasio kontras teks nominal terhadap background putih adalah 14.2:1 (Lulus Level AAA).
