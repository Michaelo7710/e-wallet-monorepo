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

export interface IAdminRepository {
  getStats(): Promise<AdminStats>;
  getPendingWithdrawals(): Promise<PendingWithdrawal[]>;
  approveWithdrawal(transactionId: string): Promise<void>;
  rejectWithdrawal(transactionId: string, reason?: string): Promise<void>;
}