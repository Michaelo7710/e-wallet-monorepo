import {
  IPaymentRepository,
  TopUpInitiateResult,
  TransferParams,
  TransferResult,
  WithdrawalParams,
} from '@domain/repositories/payment.repository.interface';
import { Transaction, SavedContact } from '@domain/entities/transaction';
import { PaymentRemoteDataSource } from '../datasources/remote/payment.remote-datasource';
import { PaymentLocalDataSource } from '../datasources/local/payment.local-datasource';
import { TransactionMapper } from '../mappers/transactionMapper';

export class PaymentRepositoryImpl implements IPaymentRepository {
  constructor(
    private remoteDataSource: PaymentRemoteDataSource,
    private localDataSource: PaymentLocalDataSource
  ) {}

  async initiateTopUp(amount: number): Promise<TopUpInitiateResult> {
    const raw = await this.remoteDataSource.initiateTopUp(amount);
    return {
      snapToken: raw.snap_token,
      redirectUrl: raw.redirect_url,
      referenceId: raw.reference_id,
    };
  }

  async transfer(params: TransferParams): Promise<TransferResult> {
    const res = await this.remoteDataSource.transfer(
      params.receiverPhoneNumber,
      params.amount,
      params.pin
    );
    const d = res.data;
    return {
      transactionId: d.transaction_id,
      amount: d.amount,
      status: d.status,
      isHighValue: d.is_high_value,
      remainingBalance: d.remaining_balance,
    };
  }

  async requestWithdrawal(params: WithdrawalParams): Promise<void> {
    await this.remoteDataSource.requestWithdrawal(
      params.bankName,
      params.accountNumber,
      params.accountName,
      params.amount
    );
  }

  /**
   * Mengambil riwayat mutasi transaksi dengan arsitektur SSOT & Offline Resilience.
   * 1. Coba sinkronisasi data terbaru dari remote API.
   * 2. Simpan hasil sinkronisasi ke basis data SQLite lokal secara persisten.
   * 3. Jika koneksi terputus (offline), sajikan data dari SQLite lokal tanpa crash/alert error.
   */
  async getHistory(
    page = 1,
    limit = 10,
    type?: string
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const raw = await this.remoteDataSource.getHistory(page, limit, type);
      const transactions = raw.data.transactions.map(TransactionMapper.toDomain);

      // Simpan transaksi ke SQLite secara persisten sebagai SSOT
      try {
        await this.localDataSource.upsertTransactions(transactions);
      } catch (dbError) {
        console.warn('⚠️ [PaymentRepository] Gagal menyinkronkan transaksi ke SQLite:', dbError);
      }

      return {
        transactions,
        total: raw.results,
      };
    } catch (error) {
      // Jalur Pemulihan Offline-First: Ambil dari basis data SQLite lokal
      const localTx = await this.localDataSource.getTransactions(page, limit, type);
      const localCount = await this.localDataSource.countTransactions(type);

      if (localTx.length > 0 || localCount > 0) {
        return {
          transactions: localTx,
          total: localCount,
        };
      }

      // Jika SQLite lokal kosong dan terjadi network error, barulah teruskan error
      throw error;
    }
  }

  /**
   * Mengambil daftar kontak tersimpan dengan kemampuan fallback ke SQLite lokal saat offline.
   */
  async getRecentContacts(): Promise<SavedContact[]> {
    try {
      const raw = await this.remoteDataSource.getRecentContacts();
      const contacts = raw.data.contacts.map(TransactionMapper.toDomainContact);

      // Simpan kontak ke basis data SQLite lokal
      try {
        await this.localDataSource.upsertContacts(contacts);
      } catch (dbError) {
        console.warn('⚠️ [PaymentRepository] Gagal menyimpan kontak ke SQLite:', dbError);
      }

      return contacts;
    } catch (error) {
      // Jalur Pemulihan Offline-First: Ambil kontak dari SQLite lokal
      try {
        const localContacts = await this.localDataSource.getContacts();
        return localContacts;
      } catch {
        throw error;
      }
    }
  }
}