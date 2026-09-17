# Screen Spec: Auth Module & Thematic Vault Mesh

> **Modul:** `features/auth`  
> **Komponen:** `AuthLayout.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx`  
> **Status:** 📐 Approved Specification  
> **Aset Terkait:** `auth-mesh-bg.png` (540 KB — pengganti `Auth-bg.png` 4.2MB)  
> **Desainer:** Senior UI/UX Designer  

---

## Layout Architecture

```
[Root: Vertical, Fill, bg: #000000]
└── [ImageBackground: source="auth-mesh-bg.png", style: Fill]
    ├── [GradientOverlay: LinearGradient "transparent" -> "rgba(6, 78, 59, 0.85)" -> "#022C22"]
    └── [SafeAreaContainer: Vertical, Fill, px:24, justify:center]
        ├── [BrandLogoGroup: Vertical, center, mb:32]
        │   ├── [LogoEmblem: 56x56, circle, bg: "rgba(16, 185, 129, 0.2)", border: 1px solid #10B981]
        │   │   └── [Icon: wallet, 32px, color: #10B981]
        │   ├── [AppTitle: 24px/Bold, color: #FFFFFF, mt:12, "GreenPay E-Wallet"]
        │   └── [AppSubtitle: 13px, color: #A7F3D0, "Enterprise FinTech Experience"]
        │
        ├── [AuthFormCard: Vertical, Fill-H, bg: "rgba(255, 255, 255, 0.95)", radius:24, p:24, shadow:2xl]
        │   ├── [FormTitle: 20px/Bold, color: #0F172A, "Selamat Datang"]
        │   ├── [FormSubtitle: 13px, color: #64748B, mb:20, "Masuk untuk melanjutkan transaksi"]
        │   ├── [Input/Email: Full-W, h:52, bg: #F8FAFC, border: 1px solid #E2E8F0]
        │   ├── [Input/Password: Full-W, h:52, bg: #F8FAFC, border: 1px solid #E2E8F0, mt:12]
        │   ├── [ForgotPasswordLink: align:right, py:8, text: 12px, color: #047857]
        │   └── [Button/Submit: Full-W, h:50, radius:12, bg: #047857, text: #FFFFFF, mt:12]
        │
        └── [FooterSwitchGroup: Horizontal, center, mt:24]
            ├── [QuestionText: 13px, color: rgba(255,255,255,0.8), "Belum punya akun? "]
            └── [ActionText: 13px/Bold, color: #34D399, "Daftar Sekarang"]
```

---

## Component Requirements

| Component | States Required | Tokens |
|:---|:---|:---|
| `Auth_Form_Card` | default, loading | bg: sys/bg/surface, radius: 24px |
| `Input_Field` | default, focus, error, disabled | bg: #F8FAFC, border: sys/border/default |
| `Button_Primary` | default, pressed, disabled, loading | bg: sys/brand/primary, text: #FFFFFF |

---

## Acceptance Criteria

- [x] All touch targets ≥ 48×48px
- [x] WCAG AA contrast verified (Card text vs background 14:1)
- [x] Loading state defined for authentication submission
- [x] Error state defined with inline red feedback on invalid inputs
- [x] Background asset reduced from 4.2MB to 540KB (`auth-mesh-bg.png`)
