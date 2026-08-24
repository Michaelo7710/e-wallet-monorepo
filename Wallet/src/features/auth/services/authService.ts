import api from '@core/network/api';
import { User } from '@domain/entities/user';

export interface AuthResponse {
  status: string;
  token: string;
  refresh_token?: string;
  data: {
    user: User;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    phone_number: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      username,
      email,
      phone_number,
      password,
    });
    return response.data;
  },
};