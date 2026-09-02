import {
  IAuthRepository,
  AuthSession,
  LoginResult,
} from '@domain/repositories/auth.repository.interface';
import { AuthRemoteDataSource } from '../datasources/remote/auth.remote-datasource';
import { UserMapper } from '../mappers/userMapper';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(private remoteDataSource: AuthRemoteDataSource) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const raw = await this.remoteDataSource.login(email, password);
    const d = raw.data as any;
    if (d?.require_2fa) {
      return {
        require2FA: true,
        preAuthToken: d.pre_auth_token,
        user: UserMapper.toDomain(d.user),
      };
    }
    return {
      require2FA: false,
      session: {
        user: UserMapper.toDomain(d.user),
        tokens: {
          accessToken: raw.token || d.access_token,
          refreshToken: raw.refresh_token || d.refresh_token || raw.token,
        },
      },
    };
  }

  async verify2FALogin(preAuthToken: string, totpCode: string): Promise<AuthSession> {
    const raw = await this.remoteDataSource.verify2FALogin(preAuthToken, totpCode);
    const d = raw.data as any;
    return {
      user: UserMapper.toDomain(d.user),
      tokens: {
        accessToken: raw.token || d.access_token,
        refreshToken: raw.refresh_token || d.refresh_token || raw.token,
      },
    };
  }

  async register(username: string, email: string, phoneNumber: string, password: string): Promise<AuthSession> {
    const raw = await this.remoteDataSource.register(username, email, phoneNumber, password);
    return {
      user: UserMapper.toDomain(raw.data.user),
      tokens: {
        accessToken: raw.token || (raw.data as any)?.access_token,
        refreshToken: raw.refresh_token || (raw.data as any)?.refresh_token || raw.token,
      },
    };
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const res = await this.remoteDataSource.verifyEmail(email, code);
    return res.status === 'success';
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const res = await this.remoteDataSource.refreshToken(refreshToken);
    return res.token;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.remoteDataSource.logout(refreshToken);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.remoteDataSource.forgotPassword(email);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await this.remoteDataSource.resetPassword(email, otp, newPassword);
  }

  async generate2FA(): Promise<{ secret: string; otpauth_url: string }> {
    const res = await this.remoteDataSource.generate2FA();
    return res.data;
  }

  async verify2FA(token: string): Promise<boolean> {
    const res = await this.remoteDataSource.verify2FA(token);
    return res.status === 'success';
  }
}