// src/theme/spacing.ts

export const spacing = {
  // Jarak antar elemen (Margin/Padding)
  xs: 4,
  sm: 8,     // Jarak kecil (misal: jarak teks dengan input)
  md: 12,
  lg: 16,    // Jarak standar industri untuk padding layar utama
  xl: 20,    // Padding kartu dompet kita
  xxl: 24,
  xxxl: 32,  // Jarak seksi besar

  // Radius Lekukan (Border Radius)
  radius: {
    sm: 4,
    md: 8,   // Radius standar untuk Tombol & Input
    lg: 16,  // Radius premium untuk Kartu & Modal
    full: 999, // Untuk Avatar / Lingkaran sempurna
  }
} as const;