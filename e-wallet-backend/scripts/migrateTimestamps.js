require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Idempotent Migration Script: Legacy `created_at` to Mongoose standard `createdAt` & `updatedAt`
 * 
 * Strategy:
 * 1. Identify documents having legacy `created_at`.
 * 2. If none found, exit gracefully with code 0 (idempotent guard).
 * 3. Update documents missing `createdAt` using an aggregation pipeline update ($set { createdAt, updatedAt }).
 * 4. Unset the legacy `created_at` field across all transaction documents.
 * 5. Disconnect gracefully and exit with code 0.
 */
async function runMigration() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ [MIGRATION ERROR] Database URI tidak ditemukan pada Environment Variables (DATABASE_URL / MONGO_URI).');
    process.exit(1);
  }

  try {
    console.log('🔄 [MIGRATION] Menghubungkan ke MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`✅ [MIGRATION] Terhubung ke MongoDB host: ${mongoose.connection.host}`);

    const collection = mongoose.connection.collection('transactions');

    // 1. Hitung total dokumen yang masih memiliki created_at
    const count = await collection.countDocuments({ created_at: { $exists: true } });

    if (count === 0) {
      console.log('✅ [MIGRATION] Seluruh dokumen transaksi sudah bersih (tidak ada created_at). Skema sudah normal.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`[MIGRATION] Menemukan ${count} dokumen transaksi dengan skema lama created_at.`);

    // 2. Salin created_at ke createdAt & updatedAt jika createdAt belum ada
    const copyResult = await collection.updateMany(
      { created_at: { $exists: true }, createdAt: { $exists: false } },
      [{ $set: { createdAt: "$created_at", updatedAt: "$created_at" } }]
    );
    console.log(`[MIGRATION] Berhasil menyalin timestamp ke ${copyResult.modifiedCount} dokumen.`);

    // 3. Hapus field legacy created_at demi konsistensi skema BSON
    const unsetResult = await collection.updateMany(
      { created_at: { $exists: true } },
      { $unset: { created_at: "" } }
    );
    console.log(`[MIGRATION] Berhasil membersihkan field legacy created_at dari ${unsetResult.modifiedCount} dokumen.`);

    console.log('🎉 [MIGRATION] Migrasi timestamps transaksi berhasil dituntaskan.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('💥 [MIGRATION ERROR] Terjadi kesalahan fatal saat eksekusi migrasi:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
