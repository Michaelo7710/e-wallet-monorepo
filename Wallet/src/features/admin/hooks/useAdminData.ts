import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { adminRepository } from '@core/di/container';
import { queryClient } from '@core/network/queryClient';

export const ADMIN_QUERY_KEYS = {
  STATS: ['admin', 'stats'] as const,
  PENDING_WITHDRAWALS: ['admin', 'withdrawals', 'pending'] as const,
  PENDING_TOPUPS: ['admin', 'topups', 'pending'] as const,
  PENDING_TRANSFERS: ['admin', 'transfers', 'pending'] as const,
  BANKS: ['admin', 'banks'] as const,
  REPORT: (filter?: string, month?: number) => ['admin', 'report', filter, month] as const,
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
  return useInfiniteQuery({
    queryKey: ADMIN_QUERY_KEYS.PENDING_WITHDRAWALS,
    queryFn: async ({ pageParam }) => {
      return await adminRepository.getPendingWithdrawals(pageParam, 10);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const usePendingTopUps = () => {
  return useInfiniteQuery({
    queryKey: ADMIN_QUERY_KEYS.PENDING_TOPUPS,
    queryFn: async ({ pageParam }) => {
      return await adminRepository.getPendingTopUps(pageParam, 10);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const usePendingTransfers = () => {
  return useInfiniteQuery({
    queryKey: ADMIN_QUERY_KEYS.PENDING_TRANSFERS,
    queryFn: async ({ pageParam }) => {
      return await adminRepository.getPendingTransfers(pageParam, 10);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useAdminBanks = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.BANKS,
    queryFn: async () => {
      return await adminRepository.getBanks();
    },
  });
};

export const useFinancialReport = (filter?: 'daily' | 'monthly', month?: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.REPORT(filter, month),
    queryFn: async () => {
      return await adminRepository.getFinancialReport(filter, month);
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

export const useApproveTopUpMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.approveTopUp(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_TOPUPS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
};

export const useCancelTopUpMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.cancelTopUp(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_TOPUPS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
};

export const useDeleteTopUpRecordMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.deleteTopUpRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_TOPUPS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
    },
  });
};

export const useApproveTransferMutation = () => {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      await adminRepository.approveTransfer(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_TRANSFERS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
};

export const useRejectTransferMutation = () => {
  return useMutation({
    mutationFn: async ({
      transactionId,
      reason,
    }: {
      transactionId: string;
      reason?: string;
    }) => {
      await adminRepository.rejectTransfer(transactionId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PENDING_TRANSFERS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STATS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'report'] });
    },
  });
};

export const useCreateBankMutation = () => {
  return useMutation({
    mutationFn: async (payload: {
      bank_name: string;
      account_number: string;
      account_name: string;
    }) => {
      return await adminRepository.createBank(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BANKS });
    },
  });
};

export const useUpdateBankMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { bank_name?: string; account_number?: string; account_name?: string };
    }) => {
      return await adminRepository.updateBank(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BANKS });
    },
  });
};

export const useDeleteBankMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.deleteBank(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BANKS });
    },
  });
};