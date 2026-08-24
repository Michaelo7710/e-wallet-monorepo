export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} dengan ID ${id} tidak ditemukan.`);
    this.name = 'EntityNotFoundError';
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super('Saldo tidak mencukupi untuk memproses transaksi.');
    this.name = 'InsufficientBalanceError';
  }
}