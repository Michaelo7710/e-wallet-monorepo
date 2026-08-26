export const QUERY_KEYS = {
  USER: {
    PROFILE: ['user', 'profile'] as const,
    CONTACTS: ['user', 'contacts'] as const,
  },
  PAYMENT: {
    HISTORY: (page: number, type?: string) => ['payment', 'history', page, type] as const,
  },
} as const;