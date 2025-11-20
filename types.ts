export interface UserProfile {
  passwordHash: string;
  isFirstTime: boolean;
  openingBalance: number;
  openingDate: string; // DD/MM/YYYY
}

export type TransactionType = 'credit' | 'debit';

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  subCategories: SubCategory[];
}

export interface Transaction {
  id: string;
  date: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD
  timestamp: number;
  type: TransactionType;
  categoryId: string;
  subCategoryId: string;
  amount: number;
  notes?: string;
  balance: number;
}

export interface StorageSchema {
  user: UserProfile | null;
  categories: Category[];
  transactions: Transaction[];
}

// Utility type for the setup form
export interface SetupFormData {
  balance: string;
  date: string; // YYYY-MM-DD from input
}