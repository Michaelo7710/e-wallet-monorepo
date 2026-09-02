import { Transaction, SavedContact } from '../entities/transaction';

export interface TopUpInitiateResult {
  snapToken: string;
  redirectUrl: string;
  referenceId: string;
}

export interface TransferParams {
  receiverPhoneNumber: string;
  amount: number;
  pin: string;
}

export interface TransferResult {
  transactionId: string;
  amount: number;
  status: 'success' | 'pending_approval';
  isHighValue: boolean;
  remainingBalance: number;
}

export interface WithdrawalParams {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
}

export interface IPaymentRepository {
  initiateTopUp(amount: number): Promise<TopUpInitiateResult>;
  transfer(params: TransferParams): Promise<TransferResult>;
  requestWithdrawal(params: WithdrawalParams): Promise<void>;
  getHistory(page?: number, limit?: number, type?: string): Promise<{ transactions: Transaction[]; total: number }>;
  getRecentContacts(): Promise<SavedContact[]>;
}