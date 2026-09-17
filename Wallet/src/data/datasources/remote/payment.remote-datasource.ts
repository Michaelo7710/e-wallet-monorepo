import api from '@core/network/api';
import {
  TransactionDTO,
  SavedContactDTO,
  WithdrawalResponseDTO,
  TransferResponseDTO,
} from '../../models/transactionDTO';

export interface RawHistoryMetadata {
  total_records: number;
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface RawHistoryResponse {
  status: string;
  message: string;
  metadata: RawHistoryMetadata;
  data: TransactionDTO[];
}

export class PaymentRemoteDataSource {
  async initiateTopUp(amount: number): Promise<{ snap_token: string; redirect_url: string; reference_id: string }> {
    const response = await api.post('/payments/topup/initiate', { amount });
    return response.data.data;
  }

  async transfer(
    receiverPhoneNumber: string,
    amount: number,
    pin: string
  ): Promise<{
    status: string;
    message: string;
    data: TransferResponseDTO;
  }> {
    const response = await api.post('/payments/transfer', {
      receiver_phone_number: receiverPhoneNumber,
      amount,
      pin,
    });
    return response.data;
  }

  async requestWithdrawal(
    bankName: string,
    accountNumber: string,
    accountName: string,
    amount: number
  ): Promise<{
    status: string;
    message: string;
    data: WithdrawalResponseDTO;
  }> {
    const response = await api.post('/payments/withdrawal/request', {
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      amount,
    });
    return response.data;
  }

  async getHistory(page = 1, limit = 10, type?: string): Promise<RawHistoryResponse> {
    const response = await api.get<RawHistoryResponse>('/payments/history', {
      params: { page, limit, type },
    });
    return response.data;
  }

  async getRecentContacts(): Promise<{ data: { contacts: SavedContactDTO[] } }> {
    const response = await api.get('/users/contacts');
    return response.data;
  }
}