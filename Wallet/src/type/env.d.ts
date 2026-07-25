// src/types/env.d.ts

declare global {
  // Kita mendefinisikan 'process' secara langsung sebagai variabel global
  var process: {
    env: {
      PUBLIC_API_URL: string;
      EXPO_BASE_URL: string;
      // Jika nanti Anda menambahkan variabel lain di .env, letakkan di sini
      // EXPO_PUBLIC_GOOGLE_MAPS_KEY: string;
    };
  };
}

// Mengekspor objek kosong wajib dilakukan agar TypeScript 
// membaca file ini sebagai modul global, bukan file biasa.
export {};