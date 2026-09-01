import api from '@core/network/api';
import { UserDTO } from '../../models/userDTO';

export class UserRemoteDataSource {
  async getProfile(): Promise<{ status: string; data: { user: UserDTO } }> {
    const response = await api.get<{ status: string; data: { user: UserDTO } }>('/users/me');
    return response.data;
  }

  async setupPin(pin: string): Promise<{ status: string; message: string }> {
    const response = await api.post<{ status: string; message: string }>('/users/setup-pin', { pin });
    return response.data;
  }

  async updatePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<{ status: string; message: string }> {
    const response = await api.patch<{ status: string; message: string }>('/users/update-password', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    return response.data;
  }

  async updateEmail(newEmail: string, otp: string, pin: string): Promise<{ status: string; email: string }> {
    const response = await api.patch<{ status: string; email: string }>('/users/update-email', {
      new_email: newEmail,
      otp,
      pin,
    });
    return response.data;
  }

  async updatePin(oldPin: string, otp: string, newPin: string, confirmNewPin: string): Promise<{ status: string; message: string }> {
    const response = await api.patch<{ status: string; message: string }>('/users/update-pin', {
      old_pin: oldPin,
      otp,
      new_pin: newPin,
      confirm_new_pin: confirmNewPin,
    });
    return response.data;
  }

  async updateKyc(nik: string): Promise<{ status: string; data: UserDTO }> {
    const response = await api.patch<{ status: string; data: UserDTO }>('/users/update-kyc', { nik });
    return response.data;
  }
}