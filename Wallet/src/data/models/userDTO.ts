// src/data/models/userDTO.ts

export interface UserDTO {
  _id: string;
  username: string;
  email: string;
  phone_number: string;
  role: 'user' | 'admin';
  is_verified: boolean;
  is_suspended: boolean;
  two_factor_enabled: boolean;
  avatar?: string | null;
  nik?: string | null;
  balance: number;
  is_email_verified?: boolean;
  is_kyc_verified?: boolean;
  account_tier?: 'basic' | 'premium';
  isEmailVerified?: boolean;
  isKycVerified?: boolean;
  accountTier?: 'basic' | 'premium';
}