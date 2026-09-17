# Screen Spec: AdminDashboardScreen (Executive Backoffice Portal)

> **Modul:** `features/admin`  
> **Komponen:** `AdminDashboardScreen.tsx`  
> **Status:** 📐 Approved Specification  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: sys/bg/canvas, SafeArea]
├── [AdminHeaderBar: Horizontal, Fill-H, h:64px, px:20, justify:between, align:center]
│   ├── [AdminInfo: Vertical]
│   │   ├── [Subtitle: 12px, color: sys/brand/primary, "Portal Administrator"]
│   │   └── [AdminName: 18px/Bold, color: sys/text/primary, "Hai, Hendra Setiawan"]
│   └── [LogoutBtn: 44x44, icon: log-out-outline, color: sys/status/error]
│
├── [ContentScroll: Vertical, Fill, scroll, px:20, py:12, gap:16]
│   ├── [SummaryStatsGrid: Grid 2x2, gap:12]
│   │   ├── [StatCard/Users: Total Pengguna, borderLeft: 4px solid #047857]
│   │   ├── [StatCard/PendingWithdraw: Pending Tarik, borderLeft: 4px solid #F59E0B]
│   │   ├── [StatCard/HighValue: Transfer AML ≥ 10Jt, borderLeft: 4px solid #EF4444]
│   │   └── [StatCard/Liquidity: Liabilitas Saldo, borderLeft: 4px solid #3B82F6]
│   │
│   └── [ActionMenuSection: Vertical, gap:12]
│       ├── [Menu/WithdrawalQueue: TouchCard, icon: card, badge: "Pending"]
│       ├── [Menu/TransferQueue: TouchCard, icon: swap-horizontal, badge: "AML"]
│       ├── [Menu/BankAccounts: TouchCard, icon: business]
│       └── [Menu/FinancialReport: TouchCard, icon: stats-chart]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Stat_Card` | loaded, loading_skeleton | bg: #FFF, radius: 16px |
| `Admin_Menu_Card` | default, pressed | bg: #FFF, border: sys/border/default |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified
- [x] Clear numerical contrast for financial monitoring
- [x] Real-time badge indicators for pending maker-checker approvals
