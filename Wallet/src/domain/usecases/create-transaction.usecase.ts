import { Transaction, TransactionType } from '../entities/transaction.entity';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ITransactionRepository } from '../repositories/transaction.repository.interface';
import { EntityNotFoundError, InsufficientBalanceError } from '../errors/domain.error';


interface CreateTransactionInput {
  userId: string;
  amount: number;
  type: TransactionType;
  description?: string;
}

export class CreateTransactionUseCase {
  constructor(
    private userRepository: IUserRepository,
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new EntityNotFoundError('User', input.userId);
    }

    if (input.type === 'DEBIT') {
      if (user.balance < input.amount) {
        throw new InsufficientBalanceError();
      }
      user.debit(input.amount);
    } else if (input.type === 'CREDIT') {
      user.credit(input.amount);
    }

    const transaction = new Transaction({
      id: crypto.randomUUID(),
      userId: input.userId,
      amount: input.amount,
      type: input.type,
      status: 'SUCCESS',
      description: input.description,
      createdAt: new Date()
    });

    await this.userRepository.updateBalance(user.id, user.balance);
    return await this.transactionRepository.create(transaction);
  }
}