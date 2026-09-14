import { UserMapper } from '../src/data/mappers/userMapper';
import { UserDTO } from '../src/data/models/userDTO';

describe('UserMapper Unit Test', () => {
  it('harus memetakan UserDTO dari API backend ke Domain User Entity secara presisi', () => {
    const mockDTO: UserDTO = {
      _id: 'usr_12345',
      username: 'Michael Dev',
      email: 'michael@greenpay.com',
      phone_number: '081234567890',
      role: 'admin',
      is_verified: true,
      is_suspended: false,
      two_factor_enabled: true,
      avatar: 'https://example.com/avatar.png',
      nik: '3201234567890001',
      balance: 1500000,
    };

    const domainEntity = UserMapper.toDomain(mockDTO);

    expect(domainEntity.id).toBe('usr_12345');
    expect(domainEntity.username).toBe('Michael Dev');
    expect(domainEntity.phoneNumber).toBe('081234567890');
    expect(domainEntity.role).toBe('admin');
    expect(domainEntity.twoFactorEnabled).toBe(true);
    expect(domainEntity.balance).toBe(1500000);
  });

  it('harus memberikan nilai fallback saat avatar atau nik bernilai null/undefined', () => {
    const minimalDTO: UserDTO = {
      _id: 'usr_999',
      username: 'User Baru',
      email: 'user@greenpay.com',
      phone_number: '0899999999',
      role: 'user',
      is_verified: false,
      is_suspended: false,
      two_factor_enabled: false,
      balance: 0,
    };

    const domainEntity = UserMapper.toDomain(minimalDTO);

    expect(domainEntity.avatar).toBeNull();
    expect(domainEntity.nik).toBeNull();
    expect(domainEntity.balance).toBe(0);
    expect(domainEntity.isEmailVerified).toBe(false);
    expect(domainEntity.isKycVerified).toBe(false);
    expect(domainEntity.accountTier).toBe('basic');
    expect(domainEntity.hasPin).toBe(false);
  });

  it('harus memetakan is_email_verified, is_kyc_verified, account_tier, dan has_pin secara konsisten', () => {
    const basicUserDTO: UserDTO = {
      _id: 'usr_basic',
      username: 'Basic User',
      email: 'basic@greenpay.com',
      phone_number: '081111111111',
      role: 'user',
      is_verified: false,
      is_suspended: false,
      two_factor_enabled: false,
      balance: 100000,
      is_email_verified: true,
      is_kyc_verified: false,
      account_tier: 'basic',
      has_pin: false,
    };

    const domainBasic = UserMapper.toDomain(basicUserDTO);
    expect(domainBasic.isEmailVerified).toBe(true);
    expect(domainBasic.isKycVerified).toBe(false);
    expect(domainBasic.accountTier).toBe('basic');
    expect(domainBasic.isVerified).toBe(false);
    expect(domainBasic.hasPin).toBe(false);

    const dtoFromDomain = UserMapper.toDTO(domainBasic);
    expect(dtoFromDomain.is_email_verified).toBe(true);
    expect(dtoFromDomain.is_kyc_verified).toBe(false);
    expect(dtoFromDomain.account_tier).toBe('basic');
    expect(dtoFromDomain.is_verified).toBe(false);
    expect(dtoFromDomain.has_pin).toBe(false);

    // Pengguna dengan PIN aktif
    const userWithPin = UserMapper.toDomain({
      ...basicUserDTO,
      has_pin: true,
    });
    expect(userWithPin.hasPin).toBe(true);
    expect(UserMapper.toDTO(userWithPin).has_pin).toBe(true);
  });
});