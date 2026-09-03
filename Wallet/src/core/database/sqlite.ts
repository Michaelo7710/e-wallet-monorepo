/**
 * GreenPay Vault Local SQLite Database Engine
 * 
 * Bertanggung jawab menyediakan instance SQLite persisten sebagai Single Source of Truth (SSOT).
 * Menjalankan migrasi DDL otomatis untuk ledger transaksi dan kontak tersimpan.
 */

import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'greenpay_vault.db';

let databaseInstance: SQLite.SQLiteDatabase | null = null;
let initializationPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const MIGRATIONS_DDL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    reference_id TEXT NOT NULL,
    type TEXT NOT NULL,
    flow TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    counterparty_username TEXT,
    counterparty_phone TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

  CREATE TABLE IF NOT EXISTS saved_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    avatar TEXT,
    last_transacted_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_last_tx ON saved_contacts(last_transacted_at DESC);
`;

/**
 * Singleton factory untuk mendapatkan instance database SQLite aktif.
 * Menginisialisasi koneksi dan mengeksekusi DDL migrations pada pembukaan pertama.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await db.execAsync(MIGRATIONS_DDL);
        databaseInstance = db;
        return db;
      } catch (error) {
        initializationPromise = null;
        throw error;
      }
    })();
  }

  return initializationPromise;
}

/**
 * Reset koneksi database (berguna untuk testing atau reset state aplikasi)
 */
export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    await databaseInstance.closeAsync();
    databaseInstance = null;
    initializationPromise = null;
  }
}
