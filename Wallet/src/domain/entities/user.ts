// src/domain/entities/user.ts

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  avatar: string | null;
  nik: string | null;
  balance: number;
}