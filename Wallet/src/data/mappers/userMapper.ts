// src/data/mappers/userMapper.ts

import { UserDTO } from '../models/userDTO';
import { User } from '@domain/entities/user';

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    return {
      id: dto._id,
      username: dto.username,
      email: dto.email,
      phoneNumber: dto.phone_number,
      role: dto.role,
      isVerified: dto.is_verified,
      isSuspended: dto.is_suspended,
      twoFactorEnabled: dto.two_factor_enabled || false,
      avatar: dto.avatar || null,
      nik: dto.nik || null,
      balance: dto.balance || 0,
    };
  }

  static toDTO(domain: User): UserDTO {
    return {
      _id: domain.id,
      username: domain.username,
      email: domain.email,
      phone_number: domain.phoneNumber,
      role: domain.role,
      is_verified: domain.isVerified,
      is_suspended: domain.isSuspended,
      two_factor_enabled: domain.twoFactorEnabled,
      avatar: domain.avatar,
      nik: domain.nik,
      balance: domain.balance,
    };
  }
}