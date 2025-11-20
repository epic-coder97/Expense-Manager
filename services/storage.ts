import { StorageSchema, UserProfile, Category, Transaction } from '../types';
import { PREDEFINED_CATEGORIES } from '../utils/initialData';

const STORAGE_KEY = 'expense_tracker_data';

const getStorageData = (): StorageSchema => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : { user: null, categories: [], transactions: [] };
    
    // Migrations
    if (!parsed.categories) parsed.categories = [];
    if (!parsed.transactions) parsed.transactions = [];
    
    return parsed;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return { user: null, categories: [], transactions: [] };
  }
};

const setStorageData = (data: StorageSchema): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};

// Helper to recalculate balances for all transactions based on timestamp
const recalculateBalances = (transactions: Transaction[], openingBalance: number): Transaction[] => {
  // 1. Sort by timestamp (oldest first)
  const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

  // 2. Iterate and calculate
  let currentBalance = openingBalance;
  
  return sorted.map(txn => {
    if (txn.type === 'credit') {
      currentBalance += txn.amount;
    } else {
      currentBalance -= txn.amount;
    }
    return { ...txn, balance: currentBalance };
  });
};

export const storageService = {
  // --- USER METHODS ---
  getUser: (): UserProfile | null => {
    const data = getStorageData();
    return data.user;
  },

  saveUser: (user: UserProfile): void => {
    const currentData = getStorageData();
    setStorageData({ ...currentData, user });
  },

  isUserExists: (): boolean => {
    const user = getStorageData().user;
    return user !== null && user.passwordHash !== '';
  },

  clearSession: (): void => {
    // Session logic handled in App state
  },

  factoryReset: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  },

  // --- CATEGORY METHODS ---
  
  initializeCategories: (): void => {
    const data = getStorageData();
    if (!data.categories || data.categories.length === 0) {
      data.categories = PREDEFINED_CATEGORIES;
      setStorageData(data);
    }
  },

  getCategories: (): Category[] => {
    return getStorageData().categories;
  },

  saveCategories: (categories: Category[]): void => {
    const data = getStorageData();
    setStorageData({ ...data, categories });
  },

  hasTransactions: (categoryId: string): boolean => {
    const txns = getStorageData().transactions;
    return txns.some(t => t.categoryId === categoryId);
  },
  
  hasSubCategoryTransactions: (subCategoryId: string): boolean => {
    const txns = getStorageData().transactions;
    return txns.some(t => t.subCategoryId === subCategoryId);
  },

  // --- TRANSACTION METHODS ---

  getTransactions: (): Transaction[] => {
    const txns = getStorageData().transactions;
    return txns.sort((a, b) => b.timestamp - a.timestamp);
  },

  addTransaction: (transaction: Omit<Transaction, 'balance'>): number => {
    const data = getStorageData();
    if (!data.user) throw new Error("User not initialized");

    const newTxn: Transaction = { ...transaction, balance: 0 };
    const allTxns = [...data.transactions, newTxn];
    const recalculated = recalculateBalances(allTxns, data.user.openingBalance);

    setStorageData({ ...data, transactions: recalculated });
    return recalculated.length;
  },

  bulkAddTransactions: (transactions: Transaction[]): number => {
    const data = getStorageData();
    if (!data.user) throw new Error("User not initialized");

    // Filter out potential duplicates based on ID if they accidentally re-import?
    // For now, assume IDs generated during import are unique enough (Date.now + random)
    
    const allTxns = [...data.transactions, ...transactions];
    const recalculated = recalculateBalances(allTxns, data.user.openingBalance);

    setStorageData({ ...data, transactions: recalculated });
    return recalculated.length;
  },

  updateTransaction: (transaction: Transaction): number => {
    const data = getStorageData();
    if (!data.user) throw new Error("User not initialized");

    const otherTxns = data.transactions.filter(t => t.id !== transaction.id);
    const updatedTxn = { ...transaction, balance: 0 };
    const allTxns = [...otherTxns, updatedTxn];
    const recalculated = recalculateBalances(allTxns, data.user.openingBalance);
    
    setStorageData({ ...data, transactions: recalculated });
    return recalculated.length;
  },

  deleteTransaction: (id: string): number => {
    const data = getStorageData();
    if (!data.user) return 0;

    const filtered = data.transactions.filter(t => t.id !== id);
    const recalculated = recalculateBalances(filtered, data.user.openingBalance);
    
    setStorageData({ ...data, transactions: recalculated });
    return recalculated.length;
  },
  
  getCurrentBalance: (): number => {
    const data = getStorageData();
    if (!data.user) return 0;
    
    const txns = data.transactions;
    if (txns.length === 0) return data.user.openingBalance;
    
    const sorted = [...txns].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0].balance;
  },

  getBalanceBefore: (timestamp: number): number => {
    const data = getStorageData();
    if (!data.user) return 0;

    const priorTxns = data.transactions.filter(t => t.timestamp < timestamp);
    if (priorTxns.length === 0) return data.user.openingBalance;
    
    priorTxns.sort((a, b) => b.timestamp - a.timestamp);
    return priorTxns[0].balance;
  },

  // --- BACKUP / IMPORT / EXPORT UTILS ---
  
  getBackupData: (): string => {
    const data = getStorageData();
    // Exclude password hash if you want strictly portable data, but for full backup usually we keep it.
    // Since password is salt/hash specific to implementation, we keep it.
    return JSON.stringify(data, null, 2);
  },

  // --- DASHBOARD STATS ---
  getDashboardStats: () => {
    const data = getStorageData();
    const txns = data.transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    const currentBalance = txns.length > 0 ? txns[0].balance : (data.user?.openingBalance || 0);
    const lastTransactionDate = txns.length > 0 ? txns[0].date : (data.user?.openingDate || '-');

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthTxns = txns.filter(t => t.isoDate.startsWith(currentMonthKey));

    const monthIncome = currentMonthTxns
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = currentMonthTxns
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseByCategory: Record<string, number> = {};
    currentMonthTxns
      .filter(t => t.type === 'debit')
      .forEach(t => {
        expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
      });

    const topCategories = Object.entries(expenseByCategory)
      .map(([id, amount]) => {
        const cat = data.categories.find(c => c.id === id);
        return { name: cat?.name || 'Unknown', amount, id };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      currentBalance,
      lastTransactionDate,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      recentTransactions: txns.slice(0, 10),
      topCategories
    };
  }
};