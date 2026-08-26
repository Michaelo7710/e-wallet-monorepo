import { useQuery, useMutation } from '@tanstack/react-query';
import { userRepository, paymentRepository } from '@core/di/container';
import { useAuthStore } from '@core/storage/useAuthStore';
import { QUERY_KEYS } from '@core/network/queryKeys';
import { queryClient } from '@core/network/queryClient';
import { TransferParams } from '@domain/repositories/payment.repository.interface';

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