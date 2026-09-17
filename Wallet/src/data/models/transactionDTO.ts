export interface TransactionDTO {
  _id: string;
  reference_id: string;
  type: 'topup' | 'transfer' | 'withdrawal';
  flow: 'in' | 'out';
  amount: number;
  status: 'pending' | 'pending_approval' | 'success' | 'failed' | 'cancel' | 'rejected';
  description: string;
  counterparty?: {
    username?: string;
    phone_number?: string;
  };
  createdAt: string;
}

export interface SavedContactDTO {
  _id: string;
  contact_user: {
    _id: string;
    username: string;
    phone_number: string;
    avatar?: string | null;
  };
  last_transacted_at: string;
}

export interface WithdrawalResponseDTO {
  reference_number: string;
  transaction_id: string;
  amount: number;
  status: 'success' | 'pending_approval';
  is_high_value: boolean;
  remaining_balance: number;
}

export interface TransferResponseDTO {
  reference_number: string;
  transaction_id: string;
  amount: number;
  status: 'success' | 'pending_approval';
  is_high_value: boolean;
  remaining_balance: number;
}