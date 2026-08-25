import { User } from '../entities/user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>;
  register(username: string, email: string, phoneNumber: string, password: string): Promise<AuthSession>;
  verifyEmail(email: string, code: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<string>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
}