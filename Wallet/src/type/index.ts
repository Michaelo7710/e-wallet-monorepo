export interface User {
  _id: string;
  username: string;
  email: string;
  phone_number: string;
  role: 'user' | 'admin';
  is_verified: boolean;
  is_suspended: boolean;
  avatar?: string | null;
  nik?: string | null;
  balance: number; // Mendaftarkan saldo sebagai angka wajib
}

export type TransactionType = 'topup' | 'transfer_in' | 'transfer_out' | 'payment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // Biasanya format ISO 8601 (2026-05-31T10:32:00Z) dari backend
}