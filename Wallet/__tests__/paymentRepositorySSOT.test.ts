import { PaymentLocalDataSource } from '../src/data/datasources/local/payment.local-datasource';
import { PaymentRepositoryImpl } from '../src/data/repositories/payment.repository.impl';
import { PaymentRemoteDataSource } from '../src/data/datasources/remote/payment.remote-datasource';
import { Transaction, SavedContact } from '../src/domain/entities/transaction';
import * as sqliteCore from '../src/core/database/sqlite';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock getDatabase
jest.mock('../src/core/database/sqlite');

describe('TASK-B2-09: Payment Local Data Source (SQLite SSOT)', () => {
  let localDataSource: PaymentLocalDataSource;
  let mockDb: any;
  let mockTransactionsTable: any[];
  let mockContactsTable: any[];

  beforeEach(() => {
    mockTransactionsTable = [];
    mockContactsTable = [];

    mockDb = {
      withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => {
        await callback();
      }),
      execAsync: jest.fn(async (_sql: string) => {
        if (_sql.includes('DELETE FROM transactions')) {
          mockTransactionsTable = [];
        }
        if (_sql.includes('DELETE FROM saved_contacts')) {
          mockContactsTable = [];
        }
      }),
      runAsync: jest.fn(async (sql: string, ...params: any[]) => {
        if (sql.includes('INSERT OR REPLACE INTO transactions')) {
          const [
            id,
            reference_id,
            type,
            flow,
            amount,
            status,
            description,
            counterparty_username,
            counterparty_phone,
            created_at,
          ] = params;

          const existingIndex = mockTransactionsTable.findIndex((t) => t.id === id);
          const row = {
            id,
            reference_id,
            type,
            flow,
            amount,
            status,
            description,
            counterparty_username,
            counterparty_phone,
            created_at,
          };

          if (existingIndex >= 0) {
            mockTransactionsTable[existingIndex] = row;
          } else {
            mockTransactionsTable.push(row);
          }
        } else if (sql.includes('INSERT OR REPLACE INTO saved_contacts')) {
          const [id, user_id, username, phone_number, avatar, last_transacted_at] = params;
          const existingIndex = mockContactsTable.findIndex((c) => c.id === id);
          const row = {
            id,
            user_id,
            username,
            phone_number,
            avatar,
            last_transacted_at,
          };

          if (existingIndex >= 0) {
            mockContactsTable[existingIndex] = row;
          } else {
            mockContactsTable.push(row);
          }
        }
      }),
      getAllAsync: jest.fn(async (sql: string, ...params: any[]) => {
        if (sql.includes('FROM transactions')) {
          let list = [...mockTransactionsTable].sort((a, b) =>
            b.created_at.localeCompare(a.created_at)
          );

          if (sql.includes('WHERE type = ?')) {
            const filterType = params[0];
            list = list.filter((t) => t.type === filterType);
            const limit = params[1];
            const offset = params[2];
            return list.slice(offset, offset + limit);
          }

          const limit = params[0];
          const offset = params[1];
          return list.slice(offset, offset + limit);
        }

        if (sql.includes('FROM saved_contacts')) {
          return [...mockContactsTable].sort((a, b) =>
            b.last_transacted_at.localeCompare(a.last_transacted_at)
          );
        }

        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string, ...params: any[]) => {
        if (sql.includes('COUNT(*) as total FROM transactions')) {
          if (sql.includes('WHERE type = ?')) {
            const filterType = params[0];
            const count = mockTransactionsTable.filter((t) => t.type === filterType).length;
            return { total: count };
          }
          return { total: mockTransactionsTable.length };
        }
        return { total: 0 };
      }),
    };

    (sqliteCore.getDatabase as jest.Mock).mockResolvedValue(mockDb);
    localDataSource = new PaymentLocalDataSource();
  });

  it('harus menyimpan dan memperbarui transaksi secara atomik (upsertTransactions)', async () => {
    const dummyTx: Transaction[] = [
      {
        id: 'tx-1',
        referenceId: 'REF-001',
        type: 'transfer',
        flow: 'out',
        amount: 50000,
        status: 'success',
        description: 'Transfer jajan',
        counterparty: {
          username: 'ahmad',
          phoneNumber: '081234567890',
        },
        createdAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'tx-2',
        referenceId: 'REF-002',
        type: 'topup',
        flow: 'in',
        amount: 200000,
        status: 'success',
        description: 'Top up saldo',
        createdAt: '2026-03-02T12:00:00Z',
      },
    ];

    await localDataSource.upsertTransactions(dummyTx);

    expect(mockDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockTransactionsTable.length).toBe(2);

    const retrieved = await localDataSource.getTransactions(1, 10);
    expect(retrieved.length).toBe(2);
    // Terurut created_at DESC (tx-2 lebih baru dari tx-1)
    expect(retrieved[0].id).toBe('tx-2');
    expect(retrieved[1].id).toBe('tx-1');
    expect(retrieved[1].counterparty?.username).toBe('ahmad');
  });

  it('harus memfilter transaksi berdasarkan parameter type', async () => {
    const dummyTx: Transaction[] = [
      {
        id: 'tx-1',
        referenceId: 'REF-001',
        type: 'transfer',
        flow: 'out',
        amount: 50000,
        status: 'success',
        description: 'Transfer',
        createdAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'tx-2',
        referenceId: 'REF-002',
        type: 'topup',
        flow: 'in',
        amount: 100000,
        status: 'success',
        description: 'Topup',
        createdAt: '2026-03-02T10:00:00Z',
      },
    ];

    await localDataSource.upsertTransactions(dummyTx);

    const topups = await localDataSource.getTransactions(1, 10, 'topup');
    expect(topups.length).toBe(1);
    expect(topups[0].id).toBe('tx-2');

    const totalTopups = await localDataSource.countTransactions('topup');
    expect(totalTopups).toBe(1);

    const totalAll = await localDataSource.countTransactions();
    expect(totalAll).toBe(2);
  });

  it('harus menyimpan, mengambil, dan menghapus seluruh kontak tersimpan', async () => {
    const dummyContacts: SavedContact[] = [
      {
        id: 'sc-1',
        userId: 'usr-1',
        username: 'budi',
        phoneNumber: '085711112222',
        avatar: 'https://avatar.png',
        lastTransactedAt: '2026-02-15T08:00:00Z',
      },
      {
        id: 'sc-2',
        userId: 'usr-2',
        username: 'citra',
        phoneNumber: '081299998888',
        avatar: null,
        lastTransactedAt: '2026-02-20T09:00:00Z',
      },
    ];

    await localDataSource.upsertContacts(dummyContacts);
    expect(mockContactsTable.length).toBe(2);

    const contacts = await localDataSource.getContacts();
    expect(contacts.length).toBe(2);
    // Terurut lastTransactedAt DESC (citra lebih baru dari budi)
    expect(contacts[0].username).toBe('citra');
    expect(contacts[1].username).toBe('budi');

    await localDataSource.clearAll();
    expect(mockTransactionsTable.length).toBe(0);
    expect(mockContactsTable.length).toBe(0);
  });
});

describe('TASK-B2-09: PaymentRepositoryImpl Offline-First Integration', () => {
  let repository: PaymentRepositoryImpl;
  let mockRemoteDataSource: jest.Mocked<PaymentRemoteDataSource>;
  let mockLocalDataSource: jest.Mocked<PaymentLocalDataSource>;

  beforeEach(() => {
    mockRemoteDataSource = {
      getHistory: jest.fn(),
      getRecentContacts: jest.fn(),
      initiateTopUp: jest.fn(),
      transfer: jest.fn(),
      requestWithdrawal: jest.fn(),
    } as any;

    mockLocalDataSource = {
      upsertTransactions: jest.fn(),
      getTransactions: jest.fn(),
      countTransactions: jest.fn(),
      upsertContacts: jest.fn(),
      getContacts: jest.fn(),
      clearAll: jest.fn(),
    } as any;

    repository = new PaymentRepositoryImpl(mockRemoteDataSource, mockLocalDataSource);
  });

  it('saat ONLINE: getHistory harus menyinkronkan transaksi remote ke SQLite lokal', async () => {
    const remoteResponse = {
      status: 'success',
      results: 1,
      data: {
        transactions: [
          {
            _id: 'tx-online-1',
            reference_id: 'REF-ON-1',
            type: 'topup',
            flow: 'in',
            amount: 50000,
            status: 'success',
            description: 'Topup Midtrans',
            createdAt: '2026-03-03T12:00:00Z',
          },
        ],
      },
    };

    mockRemoteDataSource.getHistory.mockResolvedValue(remoteResponse as any);
    mockLocalDataSource.upsertTransactions.mockResolvedValue();

    const result = await repository.getHistory(1, 10);

    expect(mockRemoteDataSource.getHistory).toHaveBeenCalledWith(1, 10, undefined);
    expect(mockLocalDataSource.upsertTransactions).toHaveBeenCalledTimes(1);
    expect(mockLocalDataSource.upsertTransactions).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'tx-online-1',
        referenceId: 'REF-ON-1',
        amount: 50000,
      }),
    ]);
    expect(result.transactions.length).toBe(1);
    expect(result.total).toBe(1);
  });

  it('saat OFFLINE: getHistory harus fallback mengambil dari SQLite lokal tanpa error crash', async () => {
    mockRemoteDataSource.getHistory.mockRejectedValue(new Error('Network Error: Connection Timed Out'));

    const cachedTx: Transaction[] = [
      {
        id: 'tx-cached-1',
        referenceId: 'REF-OFF-1',
        type: 'transfer',
        flow: 'out',
        amount: 75000,
        status: 'success',
        description: 'Offline Transfer Record',
        createdAt: '2026-03-01T09:00:00Z',
      },
    ];

    mockLocalDataSource.getTransactions.mockResolvedValue(cachedTx);
    mockLocalDataSource.countTransactions.mockResolvedValue(1);

    const result = await repository.getHistory(1, 10);

    expect(mockRemoteDataSource.getHistory).toHaveBeenCalled();
    expect(mockLocalDataSource.getTransactions).toHaveBeenCalledWith(1, 10, undefined);
    expect(mockLocalDataSource.countTransactions).toHaveBeenCalledWith(undefined);
    expect(result.transactions).toEqual(cachedTx);
    expect(result.total).toBe(1);
  });

  it('saat OFFLINE dan SQLite kosong: harus meneruskan operational error terkendali', async () => {
    const networkError = new Error('Network Error: Offline');
    mockRemoteDataSource.getHistory.mockRejectedValue(networkError);
    mockLocalDataSource.getTransactions.mockResolvedValue([]);
    mockLocalDataSource.countTransactions.mockResolvedValue(0);

    await expect(repository.getHistory(1, 10)).rejects.toThrow('Network Error: Offline');
  });

  it('saat ONLINE: getRecentContacts harus menyimpan kontak ke SQLite lokal', async () => {
    const remoteResponse = {
      status: 'success',
      data: {
        contacts: [
          {
            _id: 'sc-1',
            contact_user: {
              _id: 'u-1',
              username: 'farhan',
              phone_number: '081299990000',
              avatar: null,
            },
            last_transacted_at: '2026-03-01T12:00:00Z',
          },
        ],
      },
    };

    mockRemoteDataSource.getRecentContacts.mockResolvedValue(remoteResponse as any);
    mockLocalDataSource.upsertContacts.mockResolvedValue();

    const contacts = await repository.getRecentContacts();

    expect(mockRemoteDataSource.getRecentContacts).toHaveBeenCalled();
    expect(mockLocalDataSource.upsertContacts).toHaveBeenCalledTimes(1);
    expect(contacts.length).toBe(1);
    expect(contacts[0].username).toBe('farhan');
  });

  it('saat OFFLINE: getRecentContacts harus fallback mengambil kontak dari SQLite lokal', async () => {
    mockRemoteDataSource.getRecentContacts.mockRejectedValue(new Error('Network Error'));

    const cachedContacts: SavedContact[] = [
      {
        id: 'sc-cached',
        userId: 'u-cached',
        username: 'ahmad_cached',
        phoneNumber: '085600001111',
        avatar: null,
        lastTransactedAt: '2026-02-28T10:00:00Z',
      },
    ];

    mockLocalDataSource.getContacts.mockResolvedValue(cachedContacts);

    const contacts = await repository.getRecentContacts();

    expect(mockRemoteDataSource.getRecentContacts).toHaveBeenCalled();
    expect(mockLocalDataSource.getContacts).toHaveBeenCalled();
    expect(contacts).toEqual(cachedContacts);
  });
});
