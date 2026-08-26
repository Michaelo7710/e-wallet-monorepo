import {
  IAdminRepository,
  AdminStats,
  PendingWithdrawal,
} from '@domain/repositories/admin.repository.interface';
import { AdminRemoteDataSource } from '../datasources/remote/admin.remote-datasource';

export class AdminRepositoryImpl implements IAdminRepository {
  constructor(private remoteDataSource: AdminRemoteDataSource) {}

  async getStats(): Promise<AdminStats> {
    const res = await this.remoteDataSource.getStats();
    return {
      totalUsers: res.data.total_users || 0,
      totalVolume: res.data.total_volume || 0,
      pendingWithdrawalsCount: res.data.pending_withdrawals_count || 0,
    };
  }

  async getPendingWithdrawals(): Promise<PendingWithdrawal[]> {
    const res = await this.remoteDataSource.getPendingWithdrawals();
    return (res.data.withdrawals || []).map((dto) => ({
      id: dto._id,
      referenceId: dto.reference_id,
      userId: dto.user_id?._id || '',
      username: dto.user_id?.username || 'Pengguna',
      bankName: dto.withdrawal_details?.bank_name || 'Bank',
      accountNumber: dto.withdrawal_details?.account_number || '-',
      accountName: dto.withdrawal_details?.account_name || '-',
      amount: dto.amount,
      status: dto.status,
      createdAt: dto.createdAt,
    }));
  }

  async approveWithdrawal(transactionId: string): Promise<void> {
    await this.remoteDataSource.approveWithdrawal(transactionId);
  }

  async rejectWithdrawal(transactionId: string, reason?: string): Promise<void> {
    await this.remoteDataSource.rejectWithdrawal(transactionId, reason);
  }
}