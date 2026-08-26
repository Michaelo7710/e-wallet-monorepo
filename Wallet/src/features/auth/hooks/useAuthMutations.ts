import { useMutation } from '@tanstack/react-query';
import { authRepository } from '@core/di/container';
import { useAuthStore } from '@core/storage/useAuthStore';
import { queryClient } from '@core/network/queryClient';

export const useLoginMutation = () => {
  const loginSession = useAuthStore((state) => state.loginSession);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authRepository.login(email, password);
    },
    onSuccess: async (session) => {
      await loginSession(session.user, session.tokens.accessToken, session.tokens.refreshToken);
      queryClient.clear();
    },
  });
};

export const useRegisterMutation = () => {
  const loginSession = useAuthStore((state) => state.loginSession);

  return useMutation({
    mutationFn: async (params: {
      username: string;
      email: string;
      phoneNumber: string;
      password: string;
    }) => {
      return await authRepository.register(
        params.username,
        params.email,
        params.phoneNumber,
        params.password
      );
    },
    onSuccess: async (session) => {
      await loginSession(session.user, session.tokens.accessToken, session.tokens.refreshToken);
      queryClient.clear();
    },
  });
};

export const useLogoutMutation = () => {
  const logoutSession = useAuthStore((state) => state.logoutSession);

  return useMutation({
    mutationFn: async (refreshToken: string) => {
      await authRepository.logout(refreshToken);
    },
    onSettled: async () => {
      await logoutSession();
      queryClient.clear();
    },
  });
};