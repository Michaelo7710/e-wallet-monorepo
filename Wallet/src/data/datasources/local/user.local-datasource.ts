/**
 * GreenPay User Local SQLite Data Source
 * 
 * Implementasi persistensi lokal untuk entitas Profil Pengguna dan Saldo
 * menggunakan SQLite sebagai Single Source of Truth (SSOT).
 */

import { getDatabase } from '@core/database/sqlite';
import { User } from '@domain/entities/user';

interface UserProfileSqliteRow {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  role: string;
  is_verified: number;
  is_suspended: number;
  two_factor_enabled: number;
  avatar: string | null;
  nik: string | null;
  balance: number;
  updated_at: string;
}

export class UserLocalDataSource {
  /**
   * Menyimpan atau memperbarui data profil pengguna secara atomik.
   */
  async upsertProfile(user: User): Promise<void> {
    if (!user) {
      return;
    }

    const db = await getDatabase();
    const sql = `
      INSERT OR REPLACE INTO user_profile (
        id,
        username,
        email,
        phone_number,
        role,
        is_verified,
        is_suspended,
        two_factor_enabled,
        avatar,
        nik,
        balance,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.runAsync(
      sql,
      user.id,
      user.username,
      user.email,
      user.phoneNumber,
      user.role,
      user.isVerified ? 1 : 0,
      user.isSuspended ? 1 : 0,
      user.twoFactorEnabled ? 1 : 0,
      user.avatar ?? null,
      user.nik ?? null,
      user.balance ?? 0,
      new Date().toISOString()
    );
  }

  /**
   * Mengambil snapshot profil dan saldo pengguna terakhir dari SQLite lokal.
   * Mengembalikan null jika tabel dalam kondisi kosong.
   */
  async getProfile(): Promise<User | null> {
    const db = await getDatabase();
    const sql = `SELECT * FROM user_profile LIMIT 1;`;
    const row = await db.getFirstAsync<UserProfileSqliteRow>(sql);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      phoneNumber: row.phone_number,
      role: row.role as 'user' | 'admin',
      isVerified: Boolean(row.is_verified),
      isSuspended: Boolean(row.is_suspended),
      twoFactorEnabled: Boolean(row.two_factor_enabled),
      avatar: row.avatar ?? null,
      nik: row.nik ?? null,
      balance: Number(row.balance),
      isEmailVerified: true,
      isKycVerified: Boolean(row.is_verified),
      accountTier: Boolean(row.is_verified) ? 'premium' : 'basic',
    };
  }

  /**
   * Mengosongkan data profil dan jejak PII pengguna saat sesi diakhiri / logout.
   */
  async clearProfile(): Promise<void> {
    const db = await getDatabase();
    await db.execAsync(`DELETE FROM user_profile;`);
  }
}
