// src/theme/typography.ts

export const typography = {
  // Ukuran Font (Skala Modular untuk Hierarki Visual)
  size: {
    xs: 12,      // Caption, keterangan waktu transaksi
    sm: 14,      // Sub-teks, placeholder input
    md: 16,      // Body utama, teks standar input form
    lg: 18,      // Sub-judul, nama menu
    xl: 20,      // Judul halaman (Header)
    xxl: 24,     // Nominal saldo sedang
    xxxl: 32,    // Nominal saldo utama di Beranda (Sangat besar & jelas)
  },

  // Ketebalan Font
  weight: {
    regular: '400',
    medium: '500',   // Untuk teks tombol agar lebih tegas
    semibold: '600', // Untuk judul sekunder
    bold: '700',     // Untuk nominal uang dan judul utama
  },

  // Jarak Antar Baris (Line Height) - Rumus industri: ukuran font x 1.5
  lineHeight: {
    tight: 16,
    normal: 24,
    relaxed: 32,
  },
} as const;

export type TypographyType = typeof typography;