const { idempotencyGuard, idempotencyStore } = require('../src/middlewares/idempotencyMiddleware');

describe('🛡️ [IDEMPOTENCY GUARD MIDDLEWARE TEST]', () => {
  beforeEach(() => {
    idempotencyStore.clear();
  });

  it('1. Harus mengizinkan request lewat tanpa cache jika x-idempotency-key tidak disertakan', () => {
    const req = { headers: {} };
    const res = { json: jest.fn(), setHeader: jest.fn() };
    const next = jest.fn();

    idempotencyGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(idempotencyStore.size).toBe(0);
  });

  it('2. Harus mencatat in-flight dan meng-cache respons dengan header MISS pada request pertama', () => {
    const req = {
      headers: { 'x-idempotency-key': 'test-uuid-001' },
      user: { _id: 'user_123' }
    };
    const res = {
      statusCode: 200,
      json: jest.fn(function (data) { return this; }),
      setHeader: jest.fn()
    };
    const next = jest.fn();

    idempotencyGuard(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Simulasi Controller menyelesaikan respons
    const mockResponseBody = { status: 'success', data: { transfer_id: 'tx_999' } };
    res.json(mockResponseBody);

    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Lookup', 'MISS');
    const stored = idempotencyStore.get('user_123:test-uuid-001');
    expect(stored).toBeDefined();
    expect(stored.status).toBe('completed');
    expect(stored.body).toEqual(mockResponseBody);
  });

  it('3. Harus mengembalikan respons idempoten dari cache dengan header HIT pada request kedua', () => {
    const req = {
      headers: { 'x-idempotency-key': 'test-uuid-002' },
      user: { _id: 'user_123' }
    };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(function (data) { return this; }),
      setHeader: jest.fn()
    };
    const next = jest.fn();

    // Request Pertama
    idempotencyGuard(req, res, next);
    const mockBody = { status: 'success', amount: 50000 };
    res.json(mockBody);

    // Request Kedua dengan key yang sama
    const next2 = jest.fn();
    const res2 = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(function (data) { return this; }),
      setHeader: jest.fn()
    };

    idempotencyGuard(req, res2, next2);

    expect(next2).not.toHaveBeenCalled(); // Controller tidak boleh dipanggil ulang!
    expect(res2.setHeader).toHaveBeenCalledWith('X-Cache-Lookup', 'HIT');
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(res2.json).toHaveBeenCalledWith(mockBody);
  });

  it('4. Harus mengembalikan 409 Conflict jika request sedang in-flight', () => {
    const req = {
      headers: { 'x-idempotency-key': 'test-uuid-003' },
      user: { _id: 'user_456' }
    };
    const res1 = {
      statusCode: 200,
      json: jest.fn(),
      setHeader: jest.fn()
    };
    const next1 = jest.fn();

    // Request 1 mulai diproses (in-flight)
    idempotencyGuard(req, res1, next1);

    // Request 2 datang sebelum request 1 selesai
    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next2 = jest.fn();

    idempotencyGuard(req, res2, next2);

    expect(next2).not.toHaveBeenCalled();
    expect(res2.status).toHaveBeenCalledWith(409);
    expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'IDEMPOTENT_OPERATION_IN_FLIGHT'
    }));
  });
});
