# Screen Spec: WithdrawScreen (Tarik Tunai / Transfer Bank)

> **Modul:** `features/payment`  
> **Komponen:** `WithdrawScreen.tsx`  
> **Status:** 📐 Approved Specification  
> **Aset Terkait:** `pattern-payment-flow.png`  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: sys/bg/canvas, SafeArea]
├── [HeaderBar: Horizontal, Fill-H, h:56px, px:16, align:center]
│   ├── [BackButton: 48x48, icon: arrow-back]
│   └── [HeaderTitle: Fill-H, text: "Tarik Tunai / Bank", h2]
│
├── [ContentScroll: Vertical, Fill, scroll, px:20, py:16, gap:16]
│   ├── [BankSelectorCard: Vertical, bg: #FFF, radius:16, p:16, gap:12]
│   │   ├── [Label: "Pilih Bank Tujuan"]
│   │   └── [BankDropdownTrigger: h:50, border: sys/border/default, justify:between]
│   │
│   ├── [AccountInputs: Vertical, gap:12]
│   │   ├── [Input/AccountNumber: h:50, bg: #FFF, keyboard: numeric]
│   │   └── [Input/AccountName: h:50, bg: #FFF, placeholder: "Nama Pemilik Rekening"]
│   │
│   └── [AmountCard: Vertical, bg: #FFF, radius:16, p:20, gap:12]
│       ├── [Label: "Nominal Penarikan (Min Rp 50.000)"]
│       ├── [BigAmountInput: 28px/Bold, prefix: "Rp"]
│       └── [FeeNotice: "Biaya penarikan: Rp 4.500"]
│
└── [StickyBottomBar: Vertical, Fill-H, p:16, bg: #FFF, borderTop: 1px solid #E2E8F0]
    └── [Button/Withdraw: Fill-H, h:50, bg: sys/brand/primary, text: "Tarik Saldo", radius:12]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Bank_Dropdown` | default, active, selected | bg: #FFF, border: sys/border/default |
| `Input_Account` | default, focus, error | bg: #FFF, border: sys/border/default |
| `Button_Withdraw` | default, pressed, disabled, loading | bg: sys/brand/primary, text: #FFF |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified
- [x] Validates minimum withdrawal amount of Rp 50.000
- [x] On successful withdrawal, navigates directly to `TransactionDetailScreen`
- [x] High-value withdrawal (≥ Rp 10 Juta) displays pending AML review status
