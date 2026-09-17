# Screen Spec: HistoryScreen (Riwayat Mutasi & Filter Kategori)

> **Modul:** `features/user`  
> **Komponen:** `HistoryScreen.tsx`  
> **Status:** 📐 Approved Specification  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: sys/bg/canvas, SafeArea]
├── [HeaderBar: Horizontal, Fill-H, h:56px, px:20, align:center]
│   └── [HeaderTitle: "Riwayat Transaksi", h1]
│
├── [FilterTabRow: Horizontal, Fill-H, px:20, py:8, gap:8]
│   ├── [Chip/All: Active, bg: sys/brand/primary, text: #FFF, "Semua"]
│   ├── [Chip/Transfer: Inactive, bg: #FFF, text: sys/text/muted, "Transfer"]
│   ├── [Chip/TopUp: Inactive, bg: #FFF, text: sys/text/muted, "Top Up"]
│   └── [Chip/Withdraw: Inactive, bg: #FFF, text: sys/text/muted, "Penarikan"]
│
├── [FlatList/Transactions: Vertical, Fill, px:20, gap:8]
│   └── [TransactionCardItem: Horizontal, Fill-H, h:80px, bg: #FFF, radius:16, p:16, touchable]
│       ├── [IconCategoryBox: 44x44, radius:12, bg: semanticBg, center]
│       ├── [TitleAndDate: Vertical, Fill-H, px:12]
│       │   ├── [Title: 14px/Bold, color: sys/text/primary]
│       │   └── [Date: 12px, color: sys/text/muted]
│       └── [AmountFlow: 15px/Bold, color: (in ? #10B981 : #EF4444)]
│
└── [EmptyStateContainer: Vertical, center, py:60 (shown if list empty)]
    ├── [Illustration/EmptyReceipt: 64x64, color: sys/border/default]
    └── [Message: "Belum ada transaksi di bulan ini"]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Filter_Chip` | default, active | bg: sys/brand/primary, text: #FFF |
| `Transaction_Card_Item` | default, pressed, loading_skeleton | bg: #FFF, radius: 16px |
| `Empty_State_Widget` | visible, hidden | text: sys/text/muted |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified
- [x] Tapping any transaction item navigates to `TransactionDetailScreen` with item data
- [x] Infinite scrolling with cursor pagination indicator
- [x] Empty state widget displayed gracefully if no transactions exist
