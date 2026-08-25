import api from '@core/network/api';
import { UserDTO } from '../../models/userDTO';

export interface RawAuthResponse {
  status: string;
  token: string;
  refresh_token?: string;
  data: {
    user: UserDTO;
  };
}

export class AuthRemoteDataSource {
  async login(email: string, password: string): Promise<RawAuthResponse> {
    const response = await api.post<RawAuthResponse>('/auth/login', { email, password });
    return response.data;
  }

  async register(username: string, email: string, phoneNumber: string, password: string): Promise<RawAuthResponse> {
    const response = await api.post<RawAuthResponse>('/auth/register', {
      username,
      email,
      phone_number: phoneNumber,
      password,
    });
    return response.data;
  }

  async verifyEmail(email: string, code: string): Promise<{ status: string }> {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await api.post('/auth/refresh-token', { refresh_token: refreshToken });
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refresh_token: refreshToken });
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {
      email,
      otp,
      new_password: newPassword,
    });
  }
}