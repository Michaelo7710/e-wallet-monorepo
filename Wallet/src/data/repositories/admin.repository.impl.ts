import {
  IAdminRepository,
  AdminStats,
  PendingWithdrawal,
  PendingTopUp,
  PendingTransfer,
  AdminBank,
  FinancialReport,
} from '@domain/repositories/admin.repository.interface';
import {
  AdminRemoteDataSource,
  RawPendingWithdrawalDTO,
  RawPendingTopUpDTO,
  RawPendingTransferDTO,
  RawAdminBankDTO,
} from '../datasources/remote/admin.remote-datasource';

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
    const rawList: RawPendingWithdrawalDTO[] = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.withdrawals || [];
    return rawList.map((dto: RawPendingWithdrawalDTO) => ({
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

  async getPendingTopUps(): Promise<PendingTopUp[]> {
    const res = await this.remoteDataSource.getPendingTopUps();
    const rawList: RawPendingTopUpDTO[] = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.topups || [];
    return rawList.map((dto: RawPendingTopUpDTO) => ({
      id: dto._id,
      referenceNumber: dto.reference_number,
      amount: dto.amount,
      status: dto.status,
      paymentMethod: dto.payment_method,
      user: {
        id: dto.user_id?._id || '',
        username: dto.user_id?.username || '',
        email: dto.user_id?.email || '',
        phoneNumber: dto.user_id?.phone_number || '',
      },
      bankDetails: dto.admin_bank_id
        ? {
            bankName: dto.admin_bank_id.bank_name,
            accountNumber: dto.admin_bank_id.account_number,
            accountName: dto.admin_bank_id.account_name,
          }
        : undefined,
      createdAt: dto.createdAt,
    }));
  }

  async approveTopUp(topUpId: string): Promise<void> {
    await this.remoteDataSource.approveTopUp(topUpId);
  }

  async cancelTopUp(topUpId: string): Promise<void> {
    await this.remoteDataSource.cancelTopUp(topUpId);
  }

  async deleteTopUpRecord(topUpId: string): Promise<void> {
    await this.remoteDataSource.deleteTopUpRecord(topUpId);
  }

  async getPendingTransfers(): Promise<PendingTransfer[]> {
    const res = await this.remoteDataSource.getPendingTransfers();
    const rawList: RawPendingTransferDTO[] = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.transfers || [];
    return rawList.map((dto: RawPendingTransferDTO) => ({
      id: dto._id,
      referenceId: dto.reference_id,
      amount: dto.amount,
      status: dto.status,
      sender: {
        id: dto.sender_id?._id || '',
        username: dto.sender_id?.username || '',
        email: dto.sender_id?.email || '',
        phoneNumber: dto.sender_id?.phone_number || '',
      },
      receiver: {
        id: dto.receiver_id?._id || '',
        username: dto.receiver_id?.username || '',
        email: dto.receiver_id?.email || '',
        phoneNumber: dto.receiver_id?.phone_number || '',
      },
      createdAt: dto.createdAt || dto.created_at || '',
    }));
  }

  async approveTransfer(transactionId: string): Promise<void> {
    await this.remoteDataSource.approveTransfer(transactionId);
  }

  async rejectTransfer(transactionId: string, reason?: string): Promise<void> {
    await this.remoteDataSource.rejectTransfer(transactionId, reason);
  }

  async getBanks(): Promise<AdminBank[]> {
    const res = await this.remoteDataSource.getBanks();
    const rawList: RawAdminBankDTO[] = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.banks || [];
    return rawList.map((dto: RawAdminBankDTO) => ({
      id: dto._id,
      bankName: dto.bank_name,
      accountNumber: dto.account_number,
      accountName: dto.account_name,
      createdAt: dto.createdAt,
    }));
  }

  async createBank(payload: {
    bank_name: string;
    account_number: string;
    account_name: string;
  }): Promise<AdminBank> {
    const res = await this.remoteDataSource.createBank(payload);
    const dto = res.data;
    return {
      id: dto._id,
      bankName: dto.bank_name,
      accountNumber: dto.account_number,
      accountName: dto.account_name,
      createdAt: dto.createdAt,
    };
  }

  async updateBank(
    id: string,
    payload: { bank_name?: string; account_number?: string; account_name?: string }
  ): Promise<AdminBank> {
    const res = await this.remoteDataSource.updateBank(id, payload);
    const dto = res.data;
    return {
      id: dto._id,
      bankName: dto.bank_name,
      accountNumber: dto.account_number,
      accountName: dto.account_name,
      createdAt: dto.createdAt,
    };
  }

  async deleteBank(id: string): Promise<void> {
    await this.remoteDataSource.deleteBank(id);
  }

  async getFinancialReport(
    filter?: 'daily' | 'monthly',
    month?: number
  ): Promise<FinancialReport> {
    const res = await this.remoteDataSource.getFinancialReport(filter, month);
    const dto = res.data;
    return {
      totalMoneyInSystem: dto.total_money_in_system || 0,
      inflow: dto.inflow || 0,
      outflow: dto.outflow || 0,
      meta: {
        filterApplied: dto.meta?.filter_applied || '',
        rangeStart: dto.meta?.range_start || '',
        rangeEnd: dto.meta?.range_end || '',
      },
    };
  }
}