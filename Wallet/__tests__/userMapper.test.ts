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
  });
});