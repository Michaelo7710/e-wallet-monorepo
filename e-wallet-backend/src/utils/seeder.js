const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Muat konfigurasi environment
dotenv.config();

// Import seluruh model
const {
  User,
  Wallet,
  AdminBank,
  TopUpRequest,
  Transaction,
  WithdrawalRequest,
  RefreshToken,
  VerificationCode,
  SavedContact
} = require('../models');

// Koneksi ke MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`📡 [SEEDER DB] MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`💥 [SEEDER DB ERROR]: ${error.message}`);
    process.exit(1);
  }
};

// ========================================================
// 1. DUMMY DATA CREATION ENGINE
// ========================================================
const seedData = async () => {
  await connectDB();

  try {
    console.log('🧹 [SEEDER] Membersihkan seluruh koleksi data lama...');
    await User.deleteMany();
    await Wallet.deleteMany();
    await AdminBank.deleteMany();
    await TopUpRequest.deleteMany();
    await Transaction.deleteMany();
    await WithdrawalRequest.deleteMany();
    await RefreshToken.deleteMany();
    await VerificationCode.deleteMany();
    await SavedContact.deleteMany();
    console.log('✨ [SEEDER] Database berhasil dibersihkan.');

    // A. Hash Kredensial Pengujian (Password: Password123!, PIN: 123456)
    const defaultPassword = await bcrypt.hash('Password123!', 12);
    const defaultPin = await bcrypt.hash('123456', 12);

    // B. Buat Akun Admin & Users
    console.log('🌱 [SEEDER] Menyuntikkan entitas Pengguna & Admin...');
    const users = await User.create([
      {
        username: 'Admin Master',
        email: 'admin@greenpay.com',
        password: defaultPassword,
        phone_number: '081111111111',
        role: 'admin',
        is_verified: true,
        pin: defaultPin
      },
      {
        username: 'Ahmad Pengirim',
        email: 'ahmad@test.com',
        password: defaultPassword,
        phone_number: '081234567890',
        role: 'user',
        is_verified: true,
        pin: defaultPin,
        nik: '3201123456780001'
      },
      {
        username: 'Budi Penerima',
        email: 'budi@test.com',
        password: defaultPassword,
        phone_number: '089876543210',
        role: 'user',
        is_verified: true,
        pin: defaultPin,
        nik: '3201123456780002'
      }
    ]);

    const [adminUser, ahmadUser, budiUser] = users;

    // C. Buat Dompet (Wallet) beserta Saldo Awal
    console.log('💳 [SEEDER] Mengalokasikan saldo awal Wallet...');
    await Wallet.create([
      { user_id: adminUser._id, balance: 0 },
      { user_id: ahmadUser._id, balance: 25000000 }, // Rp 25.000.000 (Siap uji Transfer High-Value)
      { user_id: budiUser._id, balance: 500000 }      // Rp 500.000
    ]);

    // D. Buat Rekening Master Platform (AdminBank)
    console.log('🏦 [SEEDER] Mendaftarkan Rekening Master Admin...');
    await AdminBank.create([
      {
        bank_name: 'Bank Central Asia (BCA)',
        account_name: 'PT GREENPAY DIGITAL INDONESIA',
        account_number: '8830998811'
      },
      {
        bank_name: 'Bank Mandiri',
        account_name: 'PT GREENPAY DIGITAL INDONESIA',
        account_number: '1370009988112'
      }
    ]);

    // E. Buat Kontak Tersimpan Awal
    console.log('🎴 [SEEDER] Menyambungkan daftar kontak awal...');
    await SavedContact.create({
      user_id: ahmadUser._id,
      contact_user_id: budiUser._id
    });

    console.log('\n======================================================');
    console.log('✅ [SEEDER SUCCESS] INJEKSI DATA SIMULASI BERHASIL!');
    console.log('======================================================');
    console.log('🔑 CREDENTIALS UNTUK LOGIN TESTING:');
    console.log('------------------------------------------------------');
    console.log('1. ADMIN  : admin@greenpay.com | Pass: Password123!');
    console.log('2. USER A : ahmad@test.com    | Pass: Password123! | PIN: 123456');
    console.log('3. USER B : budi@test.com     | Pass: Password123! | PIN: 123456');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`💥 [SEEDER ERROR]: ${error.message}`);
    process.exit(1);
  }
};

// ========================================================
// 2. DESTROYER ENGINE (OPSI HAPUS DATA)
// ========================================================
const destroyData = async () => {
  await connectDB();

  try {
    console.log('🔥 [SEEDER] Dimulai pembersihan total seluruh data...');
    await User.deleteMany();
    await Wallet.deleteMany();
    await AdminBank.deleteMany();
    await TopUpRequest.deleteMany();
    await Transaction.deleteMany();
    await WithdrawalRequest.deleteMany();
    await RefreshToken.deleteMany();
    await VerificationCode.deleteMany();
    await SavedContact.deleteMany();

    console.log('🧹 [SEEDER SUCCESS] Seluruh data berhasil dimusnahkan.');
    process.exit(0);
  } catch (error) {
    console.error(`💥 [DESTROY ERROR]: ${error.message}`);
    process.exit(1);
  }
};

// Deteksi argumen dari terminal CLI
if (process.argv[2] === '-d' || process.argv[2] === '--destroy') {
  destroyData();
} else {
  seedData();
}