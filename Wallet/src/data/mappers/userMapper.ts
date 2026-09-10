// src/data/mappers/userMapper.ts

import { UserDTO } from '../models/userDTO';
import { User } from '@domain/entities/user';

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    const isKyc = dto.is_kyc_verified ?? dto.isKycVerified ?? dto.is_verified ?? false;
    const isEmail = dto.is_email_verified ?? dto.isEmailVerified ?? false;
    const tier = dto.account_tier ?? dto.accountTier ?? (isKyc ? 'premium' : 'basic');

    return {
      id: dto._id,
      username: dto.username,
      email: dto.email,
      phoneNumber: dto.phone_number,
      role: dto.role,
      isVerified: isKyc,
      isSuspended: dto.is_suspended,
      twoFactorEnabled: dto.two_factor_enabled || false,
      avatar: dto.avatar || null,
      nik: dto.nik || null,
      balance: dto.balance || 0,
      isEmailVerified: isEmail,
      isKycVerified: isKyc,
      accountTier: tier,
      hasPin: Boolean(dto.has_pin ?? dto.hasPin ?? false),
      idCardPhoto: dto.id_card_photo ?? dto.idCardPhoto ?? null,
      bio: dto.bio ?? null,
    };
  }

  static toDTO(domain: User): UserDTO {
    return {
      _id: domain.id,
      username: domain.username,
      email: domain.email,
      phone_number: domain.phoneNumber,
      role: domain.role,
      is_verified: domain.isKycVerified ?? domain.isVerified,
      is_suspended: domain.isSuspended,
      two_factor_enabled: domain.twoFactorEnabled,
      avatar: domain.avatar,
      nik: domain.nik,
      balance: domain.balance,
      is_email_verified: domain.isEmailVerified,
      is_kyc_verified: domain.isKycVerified,
      account_tier: domain.accountTier,
      isEmailVerified: domain.isEmailVerified,
      isKycVerified: domain.isKycVerified,
      accountTier: domain.accountTier,
      has_pin: domain.hasPin,
      hasPin: domain.hasPin,
      id_card_photo: domain.idCardPhoto ?? null,
      idCardPhoto: domain.idCardPhoto ?? null,
      bio: domain.bio ?? null,
    };
  }
}