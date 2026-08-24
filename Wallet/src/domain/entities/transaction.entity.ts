export type TransactionType = 'DEBIT' | 'CREDIT' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface TransactionProps {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  createdAt: Date;
}

export class Transaction {
  constructor(private props: TransactionProps) {
    if (props.amount <= 0) {
      throw new Error('Nominal transaksi harus lebih dari 0.');
    }
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get amount(): number { return this.props.amount; }
  get type(): TransactionType { return this.props.type; }
  get status(): TransactionStatus { return this.props.status; }

  public markSuccess(): void {
    this.props.status = 'SUCCESS';
  }

  public markFailed(): void {
    this.props.status = 'FAILED';
  }
}