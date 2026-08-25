// import { User } from '../entities/user.entity';
// import { IBaseRepository } from './base.repository.interface';

// export interface IUserRepository extends IBaseRepository<User> {
//   findByEmail(email: string): Promise<User | null>;
//   updateBalance(id: string, newBalance: number): Promise<void>;
// }

import { User } from '../entities/user';

export interface IUserRepository {
  getProfile(): Promise<User>;
  setupPin(pin: string): Promise<void>;
  updatePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void>;
  updateEmail(newEmail: string, otp: string, pin: string): Promise<void>;
  updatePin(oldPin: string, otp: string, newPin: string, confirmNewPin: string): Promise<void>;
  updateKyc(nik: string): Promise<void>;
}