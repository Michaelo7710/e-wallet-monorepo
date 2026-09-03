export interface AdminStats {
  totalUsers: number;
  totalVolume: number;
  pendingWithdrawalsCount: number;
}

export interface PendingWithdrawal {
  id: string;
  referenceId: string;
  userId: string;
  username: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface PendingTopUp {
  id: string;
  referenceNumber: string;
  amount: number;
  status: string;
  paymentMethod: string;
  user: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
}

export interface PendingTransfer {
  id: string;
  referenceId: string;
  amount: number;
  status: string;
  sender: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
  };
  receiver: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
  };
  createdAt: string;
}

export interface AdminBank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
}

export interface FinancialReport {
  totalMoneyInSystem: number;
  inflow: number;
  outflow: number;
  meta: {
    filterApplied: string;
    rangeStart: string;
    rangeEnd: string;
  };
}

export interface AdminPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface IAdminRepository {
  getStats(): Promise<AdminStats>;
  getPendingWithdrawals(cursor?: string, limit?: number): Promise<AdminPaginatedResult<PendingWithdrawal>>;
  approveWithdrawal(transactionId: string): Promise<void>;
  rejectWithdrawal(transactionId: string, reason?: string): Promise<void>;
  getPendingTopUps(cursor?: string, limit?: number): Promise<AdminPaginatedResult<PendingTopUp>>;
  approveTopUp(topUpId: string): Promise<void>;
  cancelTopUp(topUpId: string): Promise<void>;
  deleteTopUpRecord(topUpId: string): Promise<void>;
  getPendingTransfers(cursor?: string, limit?: number): Promise<AdminPaginatedResult<PendingTransfer>>;
  approveTransfer(transactionId: string): Promise<void>;
  rejectTransfer(transactionId: string, reason?: string): Promise<void>;
  getBanks(): Promise<AdminBank[]>;
  createBank(payload: { bank_name: string; account_number: string; account_name: string }): Promise<AdminBank>;
  updateBank(id: string, payload: { bank_name?: string; account_number?: string; account_name?: string }): Promise<AdminBank>;
  deleteBank(id: string): Promise<void>;
  getFinancialReport(filter?: 'daily' | 'monthly', month?: number): Promise<FinancialReport>;
}