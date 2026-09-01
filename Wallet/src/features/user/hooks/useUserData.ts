import { useQuery, useMutation } from '@tanstack/react-query';
import { userRepository, paymentRepository } from '@core/di/container';
import { useAuthStore } from '@core/storage/useAuthStore';
import { QUERY_KEYS } from '@core/network/queryKeys';
import { queryClient } from '@core/network/queryClient';
import { TransferParams } from '@domain/repositories/payment.repository.interface';

export interface SetupPinPayload {
  pin: string;
}

export interface UpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateEmailPayload {
  newEmail: string;
  otp: string;
  pin: string;
}

export interface UpdatePinPayload {
  oldPin: string;
  otp: string;
  newPin: string;
  confirmNewPin: string;
}

export interface UpdateKycPayload {
  nik: string;
}

export const useUserProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: QUERY_KEYS.USER.PROFILE,
    queryFn: async () => {
      const user = await userRepository.getProfile();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
};

export const useTransactionHistory = (page = 1, type?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.PAYMENT.HISTORY(page, type),
    queryFn: async () => {
      return await paymentRepository.getHistory(page, 10, type);
    },
  });
};

export const useTransferMutation = () => {
  return useMutation({
    mutationFn: async (params: TransferParams) => {
      return await paymentRepository.transfer(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
    },
  });
};

export const useSetupPinMutation = () => {
  return useMutation({
    mutationFn: async ({ pin }: SetupPinPayload) => {
      await userRepository.setupPin(pin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
    },
  });
};

export const useUpdatePasswordMutation = () => {
  return useMutation({
    mutationFn: async ({
      oldPassword,
      newPassword,
      confirmNewPassword,
    }: UpdatePasswordPayload) => {
      await userRepository.updatePassword(oldPassword, newPassword, confirmNewPassword);
    },
  });
};

export const useUpdateEmailMutation = () => {
  return useMutation({
    mutationFn: async ({ newEmail, otp, pin }: UpdateEmailPayload) => {
      return await userRepository.updateEmail(newEmail, otp, pin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
    },
  });
};

export const useUpdatePinMutation = () => {
  return useMutation({
    mutationFn: async ({
      oldPin,
      otp,
      newPin,
      confirmNewPin,
    }: UpdatePinPayload) => {
      await userRepository.updatePin(oldPin, otp, newPin, confirmNewPin);
    },
  });
};

export const useUpdateKycMutation = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async ({ nik }: UpdateKycPayload) => {
      return await userRepository.updateKyc(nik);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
    },
  });
};