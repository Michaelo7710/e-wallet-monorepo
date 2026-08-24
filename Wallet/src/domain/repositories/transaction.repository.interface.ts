import { Transaction } from '../entities/transaction.entity';
import { IBaseRepository } from './base.repository.interface';

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  findByUserId(userId: string): Promise<Transaction[]>;
}