// src/data/mappers/userMapper.ts

import { UserDTO } from '../models/userDTO';
import { User } from '@domain/entities/user';

export class UserMapper {
  static toDomain(raw: UserDTO): User {
    return {
      id: raw._id,
      username: raw.username,
      email: raw.email,
      phoneNumber: raw.phone_number,
      role: raw.role,
      isVerified: raw.is_verified,
      isSuspended: raw.is_suspended,
      avatar: raw.avatar || null,
      nik: raw.nik || null,
      balance: raw.balance || 0,
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
      avatar: domain.avatar,
      nik: domain.nik,
      balance: domain.balance,
    };
  }
}