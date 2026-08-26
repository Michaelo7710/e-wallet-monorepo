import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentRepository } from '@core/di/container';
import { QUERY_KEYS } from '@core/network/queryKeys';
import { queryClient } from '@core/network/queryClient';
import { TransferParams, WithdrawalParams } from '@domain/repositories/payment.repository.interface';

export const useInitiateTopUpMutation = () => {
  return useMutation({
    mutationFn: async (amount: number) => {
      return await paymentRepository.initiateTopUp(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
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

export const useWithdrawalMutation = () => {
  return useMutation({
    mutationFn: async (params: WithdrawalParams) => {
      await paymentRepository.requestWithdrawal(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
    },
  });
};

export const useRecentContacts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.CONTACTS,
    queryFn: async () => {
      return await paymentRepository.getRecentContacts();
    },
  });
};