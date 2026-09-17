# Screen Spec: TransferScreen (P2P Transfer with Haptic PIN Modal)

> **Modul:** `features/payment`  
> **Komponen:** `TransferScreen.tsx`  
> **Status:** 📐 Approved Specification  
> **Aset Terkait:** `pattern-payment-flow.png`  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: sys/bg/canvas, SafeArea]
├── [HeaderBar: Horizontal, Fill-H, h:56px, px:16, align:center]
│   ├── [BackButton: 48x48, icon: arrow-back]
│   └── [HeaderTitle: Fill-H, text: "Transfer Saldo", h2]
│
├── [ContentScroll: Vertical, Fill, scroll, px:20, py:16, gap:16]
│   ├── [RecipientInputSection: Vertical, gap:8]
│   │   ├── [Label: "Nomor Ponsel Penerima"]
│   │   └── [InputWithContactBook: h:52, bg: #FFF, border: sys/border/default]
│   │
│   ├── [RecentContactsChipRow: Horizontal, scroll, gap:12, py:8]
│   │   └── [ContactPill: 40x40 Avatar + Name]
│   │
│   ├── [AmountInputSection: Vertical, bg: #FFF, radius:16, p:20, gap:12]
│   │   ├── [Label: "Nominal Transfer"]
│   │   ├── [BigAmountInput: 32px/Bold, color: sys/brand/primary, prefix: "Rp"]
│   │   └── [BalanceHelperText: "Saldo Aktif: Rp 1.450.000"]
│   │
│   └── [NotesInputSection: Vertical, gap:8]
│       └── [InputNotes: h:48, bg: #FFF, placeholder: "Tulis catatan (opsional)"]
│
├── [StickyBottomBar: Vertical, Fill-H, p:16, bg: #FFF, borderTop: 1px solid #E2E8F0]
│   └── [Button/Continue: Fill-H, h:50, bg: sys/brand/primary, text: "Lanjutkan", radius:12]
│
└── [PinModalOverlay: Modal, center, blur/dim: 0.6]
    └── [PinSheetCard: Vertical, Fill-H, bg: #FFF, radius:24, p:24, align:center]
        ├── [Title: "Masukkan PIN Keamanan"]
        ├── [PinMaskedDots: Horizontal, gap:16, py:20, 6 dots with haptic vibration]
        └── [NumericKeypad: Grid 3x4, touch targets 64x64]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Input_Recipient` | default, focus, error | bg: #FFF, border: sys/border/default |
| `Pin_Modal` | default, error_shake, verified | bg: #FFF, dots: sys/brand/primary |
| `Button_Continue` | default, pressed, disabled, loading | bg: sys/brand/primary, text: #FFF |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified
- [x] PIN modal gives light haptic feedback on digit entry
- [x] On successful transfer, navigates directly to `TransactionDetailScreen`
- [x] Graceful degradation banner displayed if transfer feature flag is disabled
