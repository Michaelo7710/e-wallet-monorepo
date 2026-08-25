import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user';
import { UserRemoteDataSource } from '../datasources/remote/user.remote-datasource';
import { UserMapper } from '../mappers/userMapper';

export class UserRepositoryImpl implements IUserRepository {
  constructor(private remoteDataSource: UserRemoteDataSource) {}

  async getProfile(): Promise<User> {
    const raw = await this.remoteDataSource.getProfile();
    return UserMapper.toDomain(raw.data.user);
  }

  async setupPin(pin: string): Promise<void> {
    await this.remoteDataSource.setupPin(pin);
  }

  async updatePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await this.remoteDataSource.updatePassword(oldPassword, newPassword, confirmNewPassword);
  }

  async updateEmail(newEmail: string, otp: string, pin: string): Promise<void> {
    await this.remoteDataSource.updateEmail(newEmail, otp, pin);
  }

  async updatePin(oldPin: string, otp: string, newPin: string, confirmNewPin: string): Promise<void> {
    await this.remoteDataSource.updatePin(oldPin, otp, newPin, confirmNewPin);
  }

  async updateKyc(nik: string): Promise<void> {
    await this.remoteDataSource.updateKyc(nik);
  }
}