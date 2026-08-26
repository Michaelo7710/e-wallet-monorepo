import { useQuery, useMutation } from '@tanstack/react-query';
import { adminRepository } from '@core/di/container';
import { queryClient } from '@core/network/queryClient';

export const ADMIN_QUERY_KEYS = {
  STATS: ['admin', 'stats'] as const,
  PENDING_WITHDRAWALS: ['admin', 'withdrawals', 'pending'] as const,
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.STATS,
    queryFn: async () => {
      return await adminRepository.getStats();
    },
  });
};

export const usePendingWithdrawals = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.PENDING_WITHDRAWALS,
    queryFn: async () => {
      return await adminRepository.getPendingWithdrawals();
    },
  });
};

export const useApproveWithdrawalMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.approveWithdrawal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_WITHDRAWALS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
    },
  });
};

export const useRejectWithdrawalMutation = () => {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await adminRepository.rejectWithdrawal(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_WITHDRAWALS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
    },
  });
};