import { IUserRepository, UpdateKycPayload } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user';
import { UserRemoteDataSource } from '../datasources/remote/user.remote-datasource';
import { UserLocalDataSource } from '../datasources/local/user.local-datasource';
import { UserMapper } from '../mappers/userMapper';

export class UserRepositoryImpl implements IUserRepository {
  constructor(
    private remoteDataSource: UserRemoteDataSource,
    private localDataSource: UserLocalDataSource
  ) {}

  async getProfile(): Promise<User> {
    try {
      const raw = await this.remoteDataSource.getProfile();
      const profileDto = raw.data?.profile || (raw.data as any)?.user;
      const walletBalance = raw.data?.wallet?.balance ?? (profileDto as any)?.balance ?? 0;

      // Suntikkan balance dari wallet ke entitas User
      const user = UserMapper.toDomain({
        ...profileDto,
        balance: walletBalance,
      });

      // Simpan ke SQLite sebagai Single Source of Truth
      if (this.localDataSource) {
        this.localDataSource.upsertProfile(user).catch((err) => {
          console.warn('[UserRepo] Gagal cache profile ke SQLite:', err);
        });
      }

      return user;
    } catch (error) {
      if (this.localDataSource) {
        const localUser = await this.localDataSource.getProfile();
        if (localUser) return localUser;
      }
      throw error;
    }
  }

  async setupPin(pin: string): Promise<void> {
    await this.remoteDataSource.setupPin(pin);
  }

  async updatePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await this.remoteDataSource.updatePassword(oldPassword, newPassword, confirmNewPassword);
  }

  async updateEmail(newEmail: string, otp: string, pin: string): Promise<{ email: string }> {
    const raw = await this.remoteDataSource.updateEmail(newEmail, otp, pin);
    return { email: raw.email };
  }

  async updatePin(oldPin: string, otp: string, newPin: string, confirmNewPin: string): Promise<void> {
    await this.remoteDataSource.updatePin(oldPin, otp, newPin, confirmNewPin);
  }

  async updateKyc(payload: UpdateKycPayload): Promise<User> {
    const raw = await this.remoteDataSource.updateKyc({
      nik: payload.nik,
      id_card_photo: payload.idCardPhoto,
      bio: payload.bio,
    });
    const updatedUser = UserMapper.toDomain(raw.data);
    await this.localDataSource.upsertProfile(updatedUser);
    return updatedUser;
  }
}