import api from '@core/network/api';

export interface RawAdminStatsDTO {
  total_users: number;
  total_volume: number;
  pending_withdrawals_count: number;
}

export interface RawPendingWithdrawalDTO {
  _id: string;
  reference_id: string;
  user_id: {
    _id: string;
    username: string;
  };
  withdrawal_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  amount: number;
  status: string;
  createdAt: string;
}

export class AdminRemoteDataSource {
  async getStats(): Promise<{ data: RawAdminStatsDTO }> {
    const res = await api.get('/admin/stats');
    return res.data;
  }

  async getPendingWithdrawals(): Promise<{ data: { withdrawals: RawPendingWithdrawalDTO[] } }> {
    const res = await api.get('/admin/withdrawals/pending');
    return res.data;
  }

  async approveWithdrawal(id: string): Promise<void> {
    await api.patch(`/admin/withdrawals/${id}/approve`);
  }

  async rejectWithdrawal(id: string, reason?: string): Promise<void> {
    await api.patch(`/admin/withdrawals/${id}/reject`, { reason });
  }
}