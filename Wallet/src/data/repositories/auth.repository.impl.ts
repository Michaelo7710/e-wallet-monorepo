import { IAuthRepository, AuthSession } from '@domain/repositories/auth.repository.interface';
import { AuthRemoteDataSource } from '../datasources/remote/auth.remote-datasource';
import { UserMapper } from '../mappers/userMapper';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(private remoteDataSource: AuthRemoteDataSource) {}

  async login(email: string, password: string): Promise<AuthSession> {
    const raw = await this.remoteDataSource.login(email, password);
    return {
      user: UserMapper.toDomain(raw.data.user),
      tokens: {
        accessToken: raw.token,
        refreshToken: raw.refresh_token || raw.token,
      },
    };
  }

  async register(username: string, email: string, phoneNumber: string, password: string): Promise<AuthSession> {
    const raw = await this.remoteDataSource.register(username, email, phoneNumber, password);
    return {
      user: UserMapper.toDomain(raw.data.user),
      tokens: {
        accessToken: raw.token,
        refreshToken: raw.refresh_token || raw.token,
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
}