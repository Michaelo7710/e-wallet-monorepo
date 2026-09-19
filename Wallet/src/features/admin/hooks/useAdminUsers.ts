import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { adminRepository } from '@core/di/container';
import { queryClient } from '@core/network/queryClient';
import { AdminUser } from '@domain/repositories/admin.repository.interface';

export interface UseAdminUsersParams {
  search?: string;
  tier?: 'basic' | 'premium';
  is_suspended?: boolean;
  limit?: number;
}

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

export const useAdminUsers = (params?: UseAdminUsersParams) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', params] as const,
    queryFn: async ({ pageParam }) => {
      return await adminRepository.getUsers({
        ...params,
        cursor: pageParam,
        limit: params?.limit || 10,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useFreezeUserMutation = () => {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<AdminUser> => {
      return await adminRepository.freezeUser(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useUnfreezeUserMutation = () => {
  return useMutation({
    mutationFn: async (id: string): Promise<AdminUser> => {
      return await adminRepository.unfreezeUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};
