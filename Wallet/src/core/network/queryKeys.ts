export const QUERY_KEYS = {
  USER: {
    PROFILE: ['user', 'profile'] as const,
    CONTACTS: ['user', 'contacts'] as const,
  },
  PAYMENT: {
    HISTORY: (page: number, type?: string) => ['payment', 'history', page, type] as const,
  },
  CONFIG: {
    FEATURE_FLAGS: ['config', 'feature_flags'] as const,
  },
} as const;