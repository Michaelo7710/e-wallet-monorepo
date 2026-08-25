import { TransactionDTO, SavedContactDTO } from '../models/transactionDTO';
import { Transaction, SavedContact } from '@domain/entities/transaction';

export class TransactionMapper {
  static toDomain(dto: TransactionDTO): Transaction {
    return {
      id: dto._id,
      referenceId: dto.reference_id,
      type: dto.type,
      flow: dto.flow,
      amount: dto.amount,
      status: dto.status,
      description: dto.description,
      counterparty: dto.counterparty
        ? {
            username: dto.counterparty.username,
            phoneNumber: dto.counterparty.phone_number,
          }
        : undefined,
      createdAt: dto.createdAt,
    };
  }

  static toDomainContact(dto: SavedContactDTO): SavedContact {
    return {
      id: dto._id,
      userId: dto.contact_user._id,
      username: dto.contact_user.username,
      phoneNumber: dto.contact_user.phone_number,
      avatar: dto.contact_user.avatar || null,
      lastTransactedAt: dto.last_transacted_at,
    };
  }
}