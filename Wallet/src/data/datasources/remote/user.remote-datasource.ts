import api from '@core/network/api';
import { UserDTO } from '../../models/userDTO';

export class UserRemoteDataSource {
  async getProfile(): Promise<{ data: { user: UserDTO } }> {
    const response = await api.get('/users/me');
    return response.data;
  }

  async setupPin(pin: string): Promise<void> {
    await api.post('/users/setup-pin', { pin });
  }

  async updatePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await api.patch('/users/update-password', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
  }

  async updateEmail(newEmail: string, otp: string, pin: string): Promise<void> {
    await api.patch('/users/update-email', {
      new_email: newEmail,
      otp,
      pin,
    });
  }

  async updatePin(oldPin: string, otp: string, newPin: string, confirmNewPin: string): Promise<void> {
    await api.patch('/users/update-pin', {
      old_pin: oldPin,
      otp,
      new_pin: newPin,
      confirm_new_pin: confirmNewPin,
    });
  }

  async updateKyc(nik: string): Promise<void> {
    await api.patch('/users/update-kyc', { nik });
  }
}