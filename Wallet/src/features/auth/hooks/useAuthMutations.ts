import { useMutation } from '@tanstack/react-query';
import { authRepository } from '@core/di/container';
import { useAuthStore } from '@core/storage/useAuthStore';
import { queryClient } from '@core/network/queryClient';
import { QUERY_KEYS } from '@core/network/queryKeys';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface Verify2FAPayload {
  token: string;
}

export const useLoginMutation = () => {
  const loginSession = useAuthStore((state) => state.loginSession);

  return useMutation({
    mutationFn: async ({ email, password }: LoginPayload) => {
      return await authRepository.login(email, password);
    },
    onSuccess: async (session) => {
      await loginSession(session.user, session.tokens.accessToken, session.tokens.refreshToken);
      queryClient.clear();
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (params: RegisterPayload) => {
      return await authRepository.register(
        params.username,
        params.email,
        params.phoneNumber,
        params.password
      );
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

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: async ({ email, code }: VerifyEmailPayload) => {
      return await authRepository.verifyEmail(email, code);
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ email }: ForgotPasswordPayload) => {
      await authRepository.forgotPassword(email);
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ email, otp, newPassword }: ResetPasswordPayload) => {
      await authRepository.resetPassword(email, otp, newPassword);
    },
  });
};

export const useGenerate2FAMutation = () => {
  return useMutation({
    mutationFn: async () => {
      return await authRepository.generate2FA();
    },
  });
};

export const useVerify2FAMutation = () => {
  return useMutation({
    mutationFn: async ({ token }: Verify2FAPayload) => {
      return await authRepository.verify2FA(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
    },
  });
};