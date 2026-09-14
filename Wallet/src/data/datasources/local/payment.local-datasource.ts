/**
 * GreenPay Payment Local SQLite Data Source
 * 
 * Implementasi persistensi lokal untuk entitas Transaksi dan Kontak Tersimpan
 * menggunakan SQLite sebagai Single Source of Truth (SSOT).
 */

import { getDatabase } from '@core/database/sqlite';
import { Transaction, SavedContact, TransactionType, TransactionFlow, TransactionStatus } from '@domain/entities/transaction';

interface TransactionSqliteRow {
  id: string;
  reference_id: string;
  type: string;
  flow: string;
  amount: number;
  status: string;
  description: string | null;
  counterparty_username: string | null;
  counterparty_phone: string | null;
  created_at: string;
}

interface SavedContactSqliteRow {
  id: string;
  user_id: string;
  username: string;
  phone_number: string;
  avatar: string | null;
  last_transacted_at: string;
}

export class PaymentLocalDataSource {
  /**
   * Menyimpan atau memperbarui data transaksi secara atomik menggunakan SQLite Transaction.
   */
  async upsertTransactions(transactions: Transaction[]): Promise<void> {
    if (!transactions || transactions.length === 0) {
      return;
    }

    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      const sql = `
        INSERT OR REPLACE INTO transactions (
          id,
          reference_id,
          type,
          flow,
          amount,
          status,
          description,
          counterparty_username,
          counterparty_phone,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      for (const tx of transactions) {
        await db.runAsync(
          sql,
          tx.id,
          tx.referenceId,
          tx.type,
          tx.flow,
          tx.amount,
          tx.status,
          tx.description || null,
          tx.counterparty?.username || null,
          tx.counterparty?.phoneNumber || null,
          tx.createdAt
        );
      }
    });
  }

  /**
   * Mengambil riwayat transaksi tersimpan dari SQLite dengan paginasi dan filter opsional.
   */
  async getTransactions(page = 1, limit = 10, type?: string): Promise<Transaction[]> {
    const db = await getDatabase();
    const offset = Math.max(0, (page - 1) * limit);

    let sql: string;
    let params: any[];

    if (type && type.trim() !== '') {
      sql = `
        SELECT * FROM transactions
        WHERE type = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
      `;
      params = [type.trim(), limit, offset];
    } else {
      sql = `
        SELECT * FROM transactions
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
      `;
      params = [limit, offset];
    }

    const rows = await db.getAllAsync<TransactionSqliteRow>(sql, ...params);
    return rows.map(this.mapRowToTransaction);
  }

  /**
   * Menghitung jumlah total transaksi di basis data lokal.
   */
  async countTransactions(type?: string): Promise<number> {
    const db = await getDatabase();
    let sql: string;
    let params: any[];

    if (type && type.trim() !== '') {
      sql = `SELECT COUNT(*) as total FROM transactions WHERE type = ?;`;
      params = [type.trim()];
    } else {
      sql = `SELECT COUNT(*) as total FROM transactions;`;
      params = [];
    }

    const result = await db.getFirstAsync<{ total: number }>(sql, ...params);
    return result?.total || 0;
  }

  /**
   * Menyimpan atau memperbarui daftar kontak tersimpan secara atomik.
   */
  async upsertContacts(contacts: SavedContact[]): Promise<void> {
    if (!contacts || contacts.length === 0) {
      return;
    }

    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      const sql = `
        INSERT OR REPLACE INTO saved_contacts (
          id,
          user_id,
          username,
          phone_number,
          avatar,
          last_transacted_at
        ) VALUES (?, ?, ?, ?, ?, ?);
      `;

      for (const contact of contacts) {
        await db.runAsync(
          sql,
          contact.id,
          contact.userId,
          contact.username,
          contact.phoneNumber,
          contact.avatar,
          contact.lastTransactedAt
        );
      }
    });
  }

  /**
   * Mengambil seluruh kontak tersimpan diurutkan dari yang paling baru bertransaksi.
   */
  async getContacts(): Promise<SavedContact[]> {
    const db = await getDatabase();
    const sql = `SELECT * FROM saved_contacts ORDER BY last_transacted_at DESC;`;
    const rows = await db.getAllAsync<SavedContactSqliteRow>(sql);
    return rows.map(this.mapRowToContact);
  }

  /**
   * Mengosongkan data transaksi dan kontak saat pengguna logout (Data Hygiene & Privacy).
   */
  async clearAll(): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM saved_contacts;
      `);
    });
  }

  private mapRowToTransaction(row: TransactionSqliteRow): Transaction {
    const hasCounterparty = Boolean(row.counterparty_username || row.counterparty_phone);

    return {
      id: row.id,
      referenceId: row.reference_id,
      type: row.type as TransactionType,
      flow: row.flow as TransactionFlow,
      amount: row.amount,
      status: row.status as TransactionStatus,
      description: row.description || '',
      counterparty: hasCounterparty
        ? {
            username: row.counterparty_username || undefined,
            phoneNumber: row.counterparty_phone || undefined,
          }
        : undefined,
      createdAt: row.created_at,
    };
  }

  private mapRowToContact(row: SavedContactSqliteRow): SavedContact {
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      phoneNumber: row.phone_number,
      avatar: row.avatar,
      lastTransactedAt: row.last_transacted_at,
    };
  }
}
