// tests/helpers/testFactory.js
const { User, Wallet, VerificationCode } = require('../../src/models');
const { signAccessToken, signRefreshToken } = require('../../src/utils/jwt');

/**
 * Factory untuk memproduksi User Reguler + Wallet + Token JWT
 */
exports.createTestUser = async (overrides = {}) => {
  const defaultPassword = 'Password123!';
  const defaultPin = '123456';

  const userData = {
    username: `User_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`,
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

  return { user, wallet, token: accessToken, accessToken, refreshToken };
};

/**
 * Factory untuk memproduksi Admin User + Token JWT
 */
exports.createTestAdmin = async (overrides = {}) => {
  const defaultPassword = 'Password123!';

  const adminData = {
    username: `Admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}@greenpay.com`,
    password: defaultPassword,
    phone_number: `081${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    role: 'admin',
    is_verified: true,
    ...overrides,
  };

  const admin = await User.create(adminData);
  const accessToken = signAccessToken(admin._id, admin.role);

  return { admin, token: accessToken, accessToken };
};