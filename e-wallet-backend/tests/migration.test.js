const mongoose = require('mongoose');
const { Transaction } = require('../src/models');

describe('🧪 [MIGRATION TIMESTAMPS TEST]', () => {
  it('Harus berhasil memigrasi field legacy created_at menjadi createdAt dan updatedAt secara idempoten', async () => {
    const collection = mongoose.connection.collection('transactions');

    const legacyDate1 = new Date('2024-01-15T10:00:00.000Z');
    const legacyDate2 = new Date('2024-02-20T15:30:00.000Z');

    // Insert dokumen mentah dengan format legacy created_at
    await collection.insertMany([
      {
        reference_id: new mongoose.Types.ObjectId(),
        reference_model: 'TopUpRequest',
        sender_id: null,
        receiver_id: new mongoose.Types.ObjectId(),
        amount: 50000,
        type: 'topup',
        is_flagged: false,
        created_at: legacyDate1
      },
      {
        reference_id: new mongoose.Types.ObjectId(),
        reference_model: 'WithdrawalRequest',
        sender_id: new mongoose.Types.ObjectId(),
        receiver_id: null,
        amount: 100000,
        type: 'withdrawal',
        is_flagged: false,
        created_at: legacyDate2
      }
    ]);

    // Verifikasi dokumen awal memiliki created_at
    const beforeCount = await collection.countDocuments({ created_at: { $exists: true } });
    expect(beforeCount).toBe(2);

    // Jalankan pipeline migrasi
    const copyResult = await collection.updateMany(
      { created_at: { $exists: true }, createdAt: { $exists: false } },
      [{ $set: { createdAt: "$created_at", updatedAt: "$created_at" } }]
    );
    expect(copyResult.modifiedCount).toBe(2);

    const unsetResult = await collection.updateMany(
      { created_at: { $exists: true } },
      { $unset: { created_at: "" } }
    );
    expect(unsetResult.modifiedCount).toBe(2);

    // Verifikasi dokumen setelah migrasi
    const afterCount = await collection.countDocuments({ created_at: { $exists: true } });
    expect(afterCount).toBe(0);

    const doc1 = await collection.findOne({ type: 'topup' });
    expect(doc1.created_at).toBeUndefined();
    expect(new Date(doc1.createdAt).toISOString()).toBe(legacyDate1.toISOString());
    expect(new Date(doc1.updatedAt).toISOString()).toBe(legacyDate1.toISOString());

    const doc2 = await collection.findOne({ type: 'withdrawal' });
    expect(doc2.created_at).toBeUndefined();
    expect(new Date(doc2.createdAt).toISOString()).toBe(legacyDate2.toISOString());
    expect(new Date(doc2.updatedAt).toISOString()).toBe(legacyDate2.toISOString());

    // Uji Idempotensi: Jalankan kembali pipeline pada data yang sudah bersih
    const countSecondCheck = await collection.countDocuments({ created_at: { $exists: true } });
    expect(countSecondCheck).toBe(0);

    const copySecondRun = await collection.updateMany(
      { created_at: { $exists: true }, createdAt: { $exists: false } },
      [{ $set: { createdAt: "$created_at", updatedAt: "$created_at" } }]
    );
    expect(copySecondRun.modifiedCount).toBe(0);
  });

  it('Transaction model baru harus otomatis membuat createdAt dan updatedAt', async () => {
    const tx = await Transaction.create({
      reference_id: new mongoose.Types.ObjectId(),
      reference_model: 'TopUpRequest',
      sender_id: null,
      receiver_id: new mongoose.Types.ObjectId(),
      amount: 75000,
      type: 'topup',
      is_flagged: false
    });

    expect(tx.createdAt).toBeDefined();
    expect(tx.updatedAt).toBeDefined();
    expect(tx.createdAt instanceof Date).toBe(true);
    expect(tx.updatedAt instanceof Date).toBe(true);
    expect(tx.created_at).toBeUndefined();
  });
});
