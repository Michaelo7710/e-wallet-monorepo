export interface UserProps {
  id: string;
  name: string;
  email: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.validate(props);
    this.props = props;
  }

  private validate(props: UserProps): void {
    if (!props.email.includes('@')) {
      throw new Error('Format email tidak valid.');
    }
    if (props.balance < 0) {
      throw new Error('Saldo tidak boleh bernilai negatif.');
    }
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get balance(): number { return this.props.balance; }
  get isActive(): boolean { return this.props.isActive; }

  public debit(amount: number): void {
    if (amount <= 0) throw new Error('Nominal debit harus lebih dari 0.');
    if (this.props.balance < amount) throw new Error('Saldo tidak mencukupi.');
    this.props.balance -= amount;
    this.props.updatedAt = new Date();
  }

  public credit(amount: number): void {
    if (amount <= 0) throw new Error('Nominal kredit harus lebih dari 0.');
    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }
}