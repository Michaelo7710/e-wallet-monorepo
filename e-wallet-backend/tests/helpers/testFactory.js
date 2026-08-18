// // tests/helpers/testFactory.js
// const { User, Wallet, AdminBank } = require('../../src/models');
// const { signAccessToken } = require('../../src/utils/jwt');
// const bcrypt = require('bcryptjs');

// /**
//  * Factory untuk memproduksi User + Wallet + JWT Token secara instan di In-Memory DB
//  */
// exports.createTestUser = async (overrides = {}) => {
//   const defaultPassword = await bcrypt.hash('Password123!', 12);
//   const defaultPin = await bcrypt.hash('123456', 12);

//   const userData = {
//     username: `User_${Date.now()}`,
//     email: `user_${Date.now()}@test.com`,
//     password: defaultPassword,
//     phone_number: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
//     role: 'user',
//     is_verified: true,
//     pin: defaultPin,
//     ...overrides,
//   };

//   const user = await User.create(userData);
//   const wallet = await Wallet.create({
//     user_id: user._id,
//     balance: overrides.balance !== undefined ? overrides.balance : 1000000, // Default Rp 1 Juta
//   });

//   const token = signAccessToken(user._id, user.role);

//   return { user, wallet, token };
// };

// /**
//  * Factory untuk memproduksi Admin User + Token
//  */
// exports.createTestAdmin = async (overrides = {}) => {
//   const defaultPassword = await bcrypt.hash('Password123!', 12);

//   const admin = await User.create({
//     username: `Admin_${Date.now()}`,
//     email: `admin_${Date.now()}@greenpay.com`,
//     password: defaultPassword,
//     phone_number: `081${Math.floor(1000000000 + Math.random() * 9000000000)}`,
//     role: 'admin',
//     is_verified: true,
//     ...overrides,
//   });

//   const token = signAccessToken(admin._id, admin.role);

//   return { admin, token };
// };

// tests/helpers/testFactory.js
const { User, Wallet, VerificationCode } = require('../../src/models');
const { signAccessToken, signRefreshToken } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

exports.createTestUser = async (overrides = {}) => {
  const defaultPassword = await bcrypt.hash('Password123!', 12);
  const defaultPin = await bcrypt.hash('123456', 12);

  const userData = {
    username: `User_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    password: defaultPassword,
    phone_number: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    role: 'user',
    is_verified: true,
    pin: defaultPin,
    ...overrides,
  };

  const user = await User.create(userData);
  const wallet = await Wallet.create({
    user_id: user._id,
    balance: overrides.balance !== undefined ? overrides.balance : 1000000,
  });

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  return { user, wallet, accessToken, refreshToken };
};