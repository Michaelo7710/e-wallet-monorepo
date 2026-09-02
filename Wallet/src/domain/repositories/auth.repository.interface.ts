import { User } from '../entities/user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface TwoFactorSecret {
  secret: string;
  otpauth_url: string;
}

export type LoginResult =
  | { require2FA: false; session: AuthSession }
  | { require2FA: true; preAuthToken: string; user: User };

export interface IAuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
  register(username: string, email: string, phoneNumber: string, password: string): Promise<AuthSession>;
  verifyEmail(email: string, code: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<string>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  generate2FA(): Promise<{ secret: string; otpauth_url: string }>;
  verify2FA(token: string): Promise<boolean>;
  verify2FALogin(preAuthToken: string, totpCode: string): Promise<AuthSession>;
}