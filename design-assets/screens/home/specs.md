# Screen Spec: HomeScreen & Emerald Platinum WalletCard

> **Modul:** `features/user`  
> **Komponen:** `HomeScreen.tsx` & `WalletCard.tsx`  
> **Status:** 📐 Approved Specification  
> **Aset Terkait:** `card-texture-platinum.png` (800x500) & `pattern-payment-flow.png`  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: sys/bg/canvas (#F8FAFC), SafeArea]
├── [AmbientHeaderSection: Vertical, Fill-H, h:140px, bg: ThematicGradient #047857 -> #065F46]
│   └── [HeaderRow: Horizontal, Fill-H, h:60px, px:20, justify:between, align:center]
│       ├── [UserProfileWidget: Horizontal, align:center, gap:12]
│       │   ├── [Avatar: 44x44, circle, border: 2px solid #FFFFFF]
│       │   └── [GreetingTextGroup: Vertical]
│       │       ├── [GreetingTime: 12px, color: rgba(255,255,255,0.8), "Selamat Sore,"]
│       │       └── [UserName: 16px/Bold, color: #FFFFFF, "Arya Raditya"]
│       └── [NotificationBellBtn: TouchTarget 48x48, center]
│           ├── [Icon: notifications-outline, 24x24, color: #FFFFFF]
│           └── [RedDotBadge: 8x8 circle, absolute top:12, right:12, bg: #EF4444]
│
├── [ScrollView: Vertical, Fill, scroll, px:20, -mt:60]
│   │
│   ├── [WalletCardContainer: Vertical, Fill-H, h:200px, radius:20, shadow:xl, overflow:hidden]
│   │   └── [ImageBackground: source="card-texture-platinum.png", Fill]
│   │       ├── [TopCardRow: Horizontal, justify:between, align:center, p:20]
│   │       │   ├── [BrandLabel: Horizontal, gap:6, align:center]
│   │       │   │   ├── [Icon: wallet-outline, color: #10B981, 18px]
│   │       │   │   └── [Text: "GREENPAY PLATINUM", 12px/Bold, color: #FFFFFF, letterSpacing:1.5]
│   │       │   └── [TierBadge: Pill, bg: rgba(16, 185, 129, 0.25), px:10, py:4, radius:12]
│   │       │       └── [Text: "KYC VERIFIED", 10px/Bold, color: #34D399]
│   │       │
│   │       ├── [MiddleCardRow: Horizontal, align:center, px:20, gap:12]
│   │       │   ├── [EMVChipVector: 36x28, radius:4, bg: LinearGradient Gold (#F59E0B -> #D97706)]
│   │       │   └── [ContactlessIcon: wifi-outline rotated 90deg, 18px, color: rgba(255,255,255,0.6)]
│   │       │
│   │       └── [BottomCardRow: Horizontal, justify:between, align:flex-end, p:20]
│   │           ├── [BalanceGroup: Vertical]
│   │           │   ├── [BalanceLabel: 11px, color: rgba(255,255,255,0.7), "Saldo Aktif"]
│   │           │   └── [BalanceValue: 24px/Bold, color: #FFFFFF, "Rp 1.450.000"]
│   │           └── [CardNumberMasked: 13px, color: rgba(255,255,255,0.8), letterSpacing:2, "•••• 8829"]
│   │
│   ├── [QuickActionsGrid: Horizontal, Fill-H, bg: sys/bg/surface, radius:16, p:16, mt:16, shadow:sm, justify:space-around]
│   │   ├── [Action/Transfer: Icon "arrow-up", color: sys/brand/accent, label: "Transfer"]
│   │   ├── [Action/TopUp: Icon "add", color: sys/brand/primary, label: "Top Up"]
│   │   ├── [Action/Withdraw: Icon "card-outline", color: #F59E0B, label: "Tarik Tunai"]
│   │   └── [Action/History: Icon "receipt-outline", color: #3B82F6, label: "Riwayat"]
│   │
│   └── [RecentActivitySection: Vertical, Fill-H, mt:24]
│       ├── [SectionHeader: Horizontal, justify:between, align:center, mb:12]
│       │   ├── [Title: 16px/Bold, color: sys/text/primary, "Transaksi Terakhir"]
│       │   └── [ViewAllBtn: 13px, color: sys/brand/primary, "Lihat Semua"]
│       └── [ActivityListCard: Vertical, bg: sys/bg/surface, radius:16, shadow:sm, p:8]
│           └── [ListItems: 3 transaksi terakhir, clickable ke TransactionDetailScreen]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Wallet_Card` | loaded, skeleton, masked_balance | bg: card-texture-platinum, text: #FFFFFF |
| `Quick_Action_Item` | default, pressed, disabled | bg: sys/bg/surface, icon: semantic |
| `Notification_Bell` | default, unread_badge, pressed | icon: #FFFFFF, badge: #EF4444 |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified
- [x] Loading skeleton defined for balance and user profile
- [x] Quick action buttons navigate correctly
- [x] Card texture rendered seamlessly without distortion
