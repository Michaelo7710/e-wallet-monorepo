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

export interface RawPendingTopUpDTO {
  _id: string;
  reference_number: string;
  amount: number;
  status: string;
  payment_method: string;
  user_id: {
    _id: string;
    username: string;
    email: string;
    phone_number: string;
  };
  admin_bank_id?: {
    _id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
  createdAt: string;
}

export interface RawPendingTransferDTO {
  _id: string;
  reference_id: string;
  amount: number;
  status: string;
  sender_id: {
    _id: string;
    username: string;
    email: string;
    phone_number: string;
  };
  receiver_id: {
    _id: string;
    username: string;
    email: string;
    phone_number: string;
  };
  created_at?: string;
  createdAt?: string;
}

export interface RawAdminBankDTO {
  _id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  createdAt: string;
}

export interface RawFinancialReportDTO {
  total_money_in_system: number;
  inflow: number;
  outflow: number;
  meta: {
    filter_applied: string;
    range_start: string;
    range_end: string;
  };
}

export class AdminRemoteDataSource {
  async getStats(): Promise<{ data: RawAdminStatsDTO }> {
    const res = await api.get('/admin/stats');
    return res.data;
  }

  async getPendingWithdrawals(): Promise<{ data: RawPendingWithdrawalDTO[] | { withdrawals: RawPendingWithdrawalDTO[] } }> {
    const res = await api.get('/admin/withdrawals/pending');
    return res.data;
  }

  async approveWithdrawal(id: string): Promise<void> {
    await api.patch(`/admin/withdrawals/${id}/approve`);
  }

  async rejectWithdrawal(id: string, reason?: string): Promise<void> {
    await api.patch(`/admin/withdrawals/${id}/reject`, { rejected_reason: reason });
  }

  // Top-Up
  async getPendingTopUps(): Promise<{ data: RawPendingTopUpDTO[] }> {
    const res = await api.get('/admin/topups/pending');
    return res.data;
  }

  async approveTopUp(id: string): Promise<void> {
    await api.patch(`/admin/topups/${id}/approve`);
  }

  async cancelTopUp(id: string): Promise<void> {
    await api.patch(`/admin/topups/${id}/cancel`);
  }

  async deleteTopUpRecord(id: string): Promise<void> {
    await api.delete(`/admin/topups/${id}`);
  }

  // Transfer
  async getPendingTransfers(): Promise<{ data: RawPendingTransferDTO[] }> {
    const res = await api.get('/admin/transfers/pending');
    return res.data;
  }

  async approveTransfer(id: string): Promise<void> {
    await api.patch(`/admin/transfers/${id}/approve`);
  }

  async rejectTransfer(id: string, reason?: string): Promise<void> {
    await api.patch(`/admin/transfers/${id}/reject`, { rejected_reason: reason });
  }

  // Bank
  async getBanks(): Promise<{ data: RawAdminBankDTO[] }> {
    const res = await api.get('/admin/banks');
    return res.data;
  }

  async createBank(payload: { bank_name: string; account_number: string; account_name: string }): Promise<{ data: RawAdminBankDTO }> {
    const res = await api.post('/admin/banks', payload);
    return res.data;
  }

  async updateBank(id: string, payload: { bank_name?: string; account_number?: string; account_name?: string }): Promise<{ data: RawAdminBankDTO }> {
    const res = await api.put(`/admin/banks/${id}`, payload);
    return res.data;
  }

  async deleteBank(id: string): Promise<void> {
    await api.delete(`/admin/banks/${id}`);
  }

  // Report
  async getFinancialReport(filter?: string, month?: number): Promise<{ data: RawFinancialReportDTO }> {
    const res = await api.get('/admin/financial-report', {
      params: { filter, month },
    });
    return res.data;
  }
}