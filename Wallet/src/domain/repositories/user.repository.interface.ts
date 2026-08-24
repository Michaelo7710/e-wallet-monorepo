import { User } from '../entities/user.entity';
import { IBaseRepository } from './base.repository.interface';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  updateBalance(id: string, newBalance: number): Promise<void>;
}