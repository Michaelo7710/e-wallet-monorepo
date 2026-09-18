import api from '@core/network/api';
import { UserDTO } from '../../models/userDTO';

export interface RawUserProfilePayload {
  profile: UserDTO;
  wallet: {
    balance: number;
    currency: string;
  };
}

export class UserRemoteDataSource {
  async getProfile(): Promise<{ status: string; data: RawUserProfilePayload }> {
    const response = await api.get<{ status: string; data: RawUserProfilePayload }>('/users/me');
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

  async requestChangeEmailOtp(newEmail: string): Promise<{ status: string; message: string; two_factor?: boolean }> {
    const response = await api.post<{ status: string; message: string; two_factor?: boolean }>('/users/change-email/request-otp', {
      new_email: newEmail,
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

  async updateKyc(payload: {
    nik: string;
    id_card_photo: string;
    bio: string;
  }): Promise<{ status: string; data: UserDTO }> {
    const formData = new FormData();
    formData.append('nik', payload.nik);
    formData.append('bio', payload.bio);

    const photoPath = payload.id_card_photo;
    if (
      typeof photoPath === 'string' &&
      (photoPath.startsWith('file://') || photoPath.startsWith('content://') || photoPath.startsWith('/'))
    ) {
      const filename = photoPath.split('/').pop() || 'ktp_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('id_card_photo', {
        uri: photoPath,
        name: filename,
        type,
      } as any);
    } else {
      formData.append('id_card_photo', photoPath as any);
    }

    const response = await api.patch<{ status: string; data: UserDTO }>('/users/update-kyc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}