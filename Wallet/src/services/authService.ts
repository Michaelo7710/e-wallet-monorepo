import api from './api';
import { User } from '@type/index';

// Kontrak data kembalian (response) dari backend Express kita
export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export const authService = {
  // Fungsi login yang siap dipakai oleh halaman UI
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
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