import {
  IPaymentRepository,
  TopUpInitiateResult,
  TransferParams,
  WithdrawalParams,
} from '@domain/repositories/payment.repository.interface';
import { Transaction, SavedContact } from '@domain/entities/transaction';
import { PaymentRemoteDataSource } from '../datasources/remote/payment.remote-datasource';
import { TransactionMapper } from '../mappers/transactionMapper';

export class PaymentRepositoryImpl implements IPaymentRepository {
  constructor(private remoteDataSource: PaymentRemoteDataSource) {}

  async initiateTopUp(amount: number): Promise<TopUpInitiateResult> {
    const raw = await this.remoteDataSource.initiateTopUp(amount);
    return {
      snapToken: raw.snap_token,
      redirectUrl: raw.redirect_url,
      referenceId: raw.reference_id,
    };
  }

  async transfer(params: TransferParams): Promise<Transaction> {
    const raw = await this.remoteDataSource.transfer(
      params.receiverPhoneNumber,
      params.amount,
      params.pin
    );
    return TransactionMapper.toDomain(raw.data.transaction);
  }

  async requestWithdrawal(params: WithdrawalParams): Promise<void> {
    await this.remoteDataSource.requestWithdrawal(
      params.bankName,
      params.accountNumber,
      params.accountName,
      params.amount
    );
  }

  async getHistory(
    page = 1,
    limit = 10,
    type?: string
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const raw = await this.remoteDataSource.getHistory(page, limit, type);
    return {
      transactions: raw.data.transactions.map(TransactionMapper.toDomain),
      total: raw.results,
    };
  }

  async getRecentContacts(): Promise<SavedContact[]> {
    const raw = await this.remoteDataSource.getRecentContacts();
    return raw.data.contacts.map(TransactionMapper.toDomainContact);
  }
}