// src/theme/colors.ts

export const colors = {
  // ==========================================
  // ARSITEKTUR WARNA UTAMA (ATURAN 60-30-10)
  // ==========================================
  
  /**
   * PROPORSI 60%: Latar Belakang & Ruang Sela
   * Menggunakan warna putih-abu-abu ultra-bersih untuk kenyamanan mata
   * dan memastikan teks kontras tinggi mudah dibaca.
   */
  background: '#F9FAFB', 
  surface: '#FFFFFF',    // Untuk latar belakang kartu, modal, atau form putih

  /**
   * PROPORSI 30%: Identitas Merek (Brand Identity)
   * Emerald Green Premium yang memancarkan rasa aman, terpercaya, dan profesional.
   */
  primary: '#047857',      // Emerald Green standar untuk Header, Ikon Utama, dan Navigasi
  primaryDark: '#065f46',  // Emerald Green lebih gelap untuk status bar atau teks penting
  primaryLight: '#D1FAE5', // Hijau sangat muda untuk latar belakang aksen kecil (badge)

  /**
   * PROPORSI 10%: Warna Aksen & Tindakan (Call to Action / CTA)
   * Warna hijau zamrud yang lebih menyala dan berenergi untuk memancing 
   * perhatian pengguna pada tombol aksi penting seperti "Transfer" atau "Top Up".
   */
  accent: '#10B981',       // Minty Emerald untuk tombol utama

  // ==========================================
  // WARNA UTALITAS & SEMANTIK (FEEDBACK SISTEM)
  // ==========================================
  
  // Tipografi (Teks Kontras Tinggi)
  textMain: '#111827',     // Abu-abu sangat gelap (Charcoal) untuk teks utama agar mata tidak lelah
  textMuted: '#4B5563',    // Abu-abu sedang (Slate) untuk sub-judul atau teks deskripsi pudar
  textLight: '#9CA3AF',    // Abu-abu muda untuk placeholder input form

  // Status Finansial & Notifikasi
  success: '#10B981',      // Hijau sukses untuk transaksi berhasil / Top Up selesai
  warning: '#F59E0B',      // Amber/Kuning untuk status pending atau peringatan limit saldo
  error: '#EF4444',        // Merah tegas untuk transaksi gagal, salah PIN, atau akun di-suspend
  info: '#3B82F6',         // Biru informatif untuk pengumuman sistem

  // Warna Dasar Mutlak
  white: '#FFFFFF',
  black: '#000000',
  border: '#E5E7EB',       // Abu-abu sangat tipis untuk garis pembatas rincian transaksi
} as const;

// Mengunci tipe data agar auto-complete TypeScript mendeteksi warna dengan presisi tinggi
export type ColorsType = typeof colors;