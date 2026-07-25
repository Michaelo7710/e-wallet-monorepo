const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// 🚀 DYNAMIC MOCK: Palsukan fungsi sendEmail agar test tidak butuh kredensial Mailtrap
jest.mock('../src/utils/email', () => jest.fn().mockResolvedValue(true));

let mongoServer;

// 1. Sebelum seluruh pengujian dimulai: Nyalakan MongoDB di RAM
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-2026';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-2026';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// 2. Setiap kali 1 test case selesai: Bersihkan seluruh koleksi data
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

// 3. Setelah seluruh pengujian selesai: Matikan koneksi database RAM
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});