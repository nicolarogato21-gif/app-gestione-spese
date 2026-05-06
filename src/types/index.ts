export type TransactionType = 'spesa' | 'ricavo';

export interface Category {
  id: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  type: TransactionType;
  categoryId: string;
  paymentMethodId: string;
  description: string;
  notes?: string;
  amount: number; // positive or negative
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}
