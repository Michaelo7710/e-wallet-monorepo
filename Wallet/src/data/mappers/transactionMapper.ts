import { TransactionDTO, SavedContactDTO } from '../models/transactionDTO';
import { Transaction, SavedContact } from '@domain/entities/transaction';

export class TransactionMapper {
  static toDomain(dto: any): Transaction {
    // Parsing defensif counterparty: string atau objek
    let counterpartyData: { username?: string; phoneNumber?: string } | undefined = undefined;

    if (typeof dto.counterparty === 'string' && dto.counterparty.trim() !== '') {
      counterpartyData = { username: dto.counterparty };
    } else if (typeof dto.counterparty === 'object' && dto.counterparty !== null) {
      counterpartyData = {
        username: dto.counterparty.username || dto.counterparty.user_name,
        phoneNumber: dto.counterparty.phone_number || dto.counterparty.phoneNumber,
      };
    }

    // Fallback deskripsi cerdas jika backend mengosongkannya
    const defaultDescription =
      dto.description ||
      (dto.type === 'topup'
        ? 'Top Up Saldo'
        : dto.type === 'withdrawal'
        ? 'Penarikan Dana Bank'
        : 'Transfer Saldo P2P');

    return {
      id: dto._id || dto.id,
      referenceId: dto.reference_id || dto.referenceId || '',
      type: dto.type,
      flow: dto.flow,
      amount: Number(dto.amount) || 0,
      status: dto.status || 'success',
      description: defaultDescription,
      counterparty: counterpartyData,
      createdAt: dto.createdAt || dto.created_at || new Date().toISOString(),
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