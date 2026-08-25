export type TransactionType = 'topup' | 'transfer' | 'withdrawal';
export type TransactionFlow = 'in' | 'out';
export type TransactionStatus =
  | 'pending'
  | 'pending_approval'
  | 'success'
  | 'failed'
  | 'cancel'
  | 'rejected';

export interface Transaction {
  id: string;
  referenceId: string;
  type: TransactionType;
  flow: TransactionFlow;
  amount: number;
  status: TransactionStatus;
  description: string;
  counterparty?: {
    username?: string;
    phoneNumber?: string;
  };
  createdAt: string;
}

export interface SavedContact {
  id: string;
  userId: string;
  username: string;
  phoneNumber: string;
  avatar: string | null;
  lastTransactedAt: string;
}