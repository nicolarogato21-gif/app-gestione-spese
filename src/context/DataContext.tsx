import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Category, PaymentMethod, Transaction, RecurringTransaction } from '../types';

interface DataContextType extends AppState {
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addPaymentMethod: (method: PaymentMethod) => Promise<void>;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  // Recurring Transactions
  addRecurringTransaction: (rec: RecurringTransaction) => Promise<void>;
  updateRecurringTransaction: (rec: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringActive: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<number>;
  newlyGeneratedCount: number;
  clearNewlyGeneratedCount: () => void;

  isLoading: boolean;
  exportData: () => void;
  importData: (data: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Altro' },
  { id: 'cat_2', name: 'Assicurazioni' },
  { id: 'cat_3', name: 'Banca' },
  { id: 'cat_4', name: 'Bellezza' },
  { id: 'cat_5', name: 'Bollette' },
  { id: 'cat_6', name: 'Casa' },
  { id: 'cat_7', name: 'Cibo' },
  { id: 'cat_8', name: 'Divertimento' },
  { id: 'cat_9', name: 'Educazione' },
  { id: 'cat_10', name: 'Farmacia' },
  { id: 'cat_11', name: 'Intrattenimento' },
  { id: 'cat_12', name: 'Investimento' },
  { id: 'cat_13', name: 'Macchina' },
  { id: 'cat_14', name: 'Matrimonio' },
  { id: 'cat_15', name: 'Mobilità' },
  { id: 'cat_16', name: 'Premio' },
  { id: 'cat_17', name: 'Prestito' },
  { id: 'cat_18', name: 'Regalo' },
  { id: 'cat_19', name: 'Rimborso' },
  { id: 'cat_20', name: 'Salute' },
  { id: 'cat_21', name: 'Shopping' },
  { id: 'cat_22', name: 'Spesa' },
  { id: 'cat_23', name: 'Sport' },
  { id: 'cat_24', name: 'Stipendio' },
  { id: 'cat_25', name: 'Tasse' },
  { id: 'cat_26', name: 'Viaggio' },
];

const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm_1', name: 'Bancomat' },
  { id: 'pm_2', name: 'Bonifico' },
  { id: 'pm_3', name: 'Carta 1680' },
  { id: 'pm_4', name: 'Carta 3676 prep' },
  { id: 'pm_5', name: 'Carta 7638' },
  { id: 'pm_6', name: 'Contanti' },
  { id: 'pm_7', name: 'Paypal' },
  { id: 'pm_8', name: 'Satispay' },
  { id: 'pm_9', name: 'ALTRO' },
];

function getFormattedDate(year: number, month: number, day: number): string {
  const daysInMonth = new Date(year, month, 0).getDate();
  const actualDay = Math.min(day, daysInMonth);
  const mm = String(month).padStart(2, '0');
  const dd = String(actualDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [newlyGeneratedCount, setNewlyGeneratedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const clearNewlyGeneratedCount = () => setNewlyGeneratedCount(0);

  // Core auto-generator function
  const processRecurringInternal = useCallback(
    async (txList: Transaction[], recList: RecurringTransaction[]) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1 - 12
      const targetYearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      let addedCount = 0;
      let updatedTxList = [...txList];
      let updatedRecList = [...recList];

      const activeRecs = updatedRecList.filter(r => r.active);

      for (let i = 0; i < activeRecs.length; i++) {
        const rec = activeRecs[i];
        // Check if already generated for this month
        const alreadyExists = updatedTxList.some(
          t => t.recurringId === rec.id && t.date.startsWith(targetYearMonth)
        );

        if (!alreadyExists && rec.lastGeneratedYearMonth !== targetYearMonth) {
          const txDate = getFormattedDate(currentYear, currentMonth, rec.dayOfMonth || 1);
          const newTx: Transaction = {
            id: uuidv4(),
            date: txDate,
            type: rec.type,
            categoryId: rec.categoryId,
            paymentMethodId: rec.paymentMethodId,
            description: rec.description,
            amount: rec.amount,
            notes: rec.notes ? `${rec.notes}` : undefined,
            recurringId: rec.id,
            isAutoGenerated: true,
          };

          updatedTxList = [newTx, ...updatedTxList];
          addedCount++;

          // Update recurring template's lastGeneratedYearMonth
          updatedRecList = updatedRecList.map(r =>
            r.id === rec.id ? { ...r, lastGeneratedYearMonth: targetYearMonth } : r
          );
        }
      }

      if (addedCount > 0) {
        setTransactions(updatedTxList);
        setRecurringTransactions(updatedRecList);
        setNewlyGeneratedCount(addedCount);
        await localforage.setItem('transactions', updatedTxList);
        await localforage.setItem('recurringTransactions', updatedRecList);
      }

      return addedCount;
    },
    []
  );

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTransactions = await localforage.getItem<Transaction[]>('transactions') || [];
        const storedCategories = await localforage.getItem<Category[]>('categories');
        const storedPaymentMethods = await localforage.getItem<PaymentMethod[]>('paymentMethods');
        const storedRecurring = await localforage.getItem<RecurringTransaction[]>('recurringTransactions') || [];

        setTransactions(storedTransactions);
        setRecurringTransactions(storedRecurring);
        
        let loadedCategories = defaultCategories;
        if (storedCategories && storedCategories.length > 0) {
          if (!storedCategories.some(c => c.name === 'Assicurazioni')) {
            await localforage.setItem('categories', defaultCategories);
          } else {
            loadedCategories = storedCategories;
          }
        } else {
          await localforage.setItem('categories', defaultCategories);
        }
        setCategories(loadedCategories);

        let loadedPaymentMethods = defaultPaymentMethods;
        if (storedPaymentMethods && storedPaymentMethods.length > 0) {
          if (!storedPaymentMethods.some(p => p.name === 'Carta 1680')) {
            await localforage.setItem('paymentMethods', defaultPaymentMethods);
          } else {
            loadedPaymentMethods = storedPaymentMethods;
          }
        } else {
          await localforage.setItem('paymentMethods', defaultPaymentMethods);
        }
        setPaymentMethods(loadedPaymentMethods);

        // Process recurring transactions automatically on app load
        await processRecurringInternal(storedTransactions, storedRecurring);

      } catch (error) {
        console.error("Failed to load data from localforage", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [processRecurringInternal]);

  // Transactions
  const addTransaction = async (tx: Transaction) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    await localforage.setItem('transactions', updated);
  };

  const updateTransaction = async (tx: Transaction) => {
    const updated = transactions.map(t => t.id === tx.id ? tx : t);
    setTransactions(updated);
    await localforage.setItem('transactions', updated);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await localforage.setItem('transactions', updated);
  };

  // Categories
  const addCategory = async (cat: Category) => {
    const updated = [...categories, cat];
    setCategories(updated);
    await localforage.setItem('categories', updated);
  };

  const updateCategory = async (cat: Category) => {
    const updated = categories.map(c => c.id === cat.id ? cat : c);
    setCategories(updated);
    await localforage.setItem('categories', updated);
  };

  const deleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await localforage.setItem('categories', updated);
  };

  // Payment Methods
  const addPaymentMethod = async (pm: PaymentMethod) => {
    const updated = [...paymentMethods, pm];
    setPaymentMethods(updated);
    await localforage.setItem('paymentMethods', updated);
  };

  const updatePaymentMethod = async (pm: PaymentMethod) => {
    const updated = paymentMethods.map(p => p.id === pm.id ? pm : p);
    setPaymentMethods(updated);
    await localforage.setItem('paymentMethods', updated);
  };

  const deletePaymentMethod = async (id: string) => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    await localforage.setItem('paymentMethods', updated);
  };

  // Recurring Transactions CRUD
  const addRecurringTransaction = async (rec: RecurringTransaction) => {
    const updated = [rec, ...recurringTransactions];
    setRecurringTransactions(updated);
    await localforage.setItem('recurringTransactions', updated);
    // Trigger check immediately so if user creates a recurring item for current month, it gets generated!
    await processRecurringInternal(transactions, updated);
  };

  const updateRecurringTransaction = async (rec: RecurringTransaction) => {
    const updated = recurringTransactions.map(r => r.id === rec.id ? rec : r);
    setRecurringTransactions(updated);
    await localforage.setItem('recurringTransactions', updated);
  };

  const deleteRecurringTransaction = async (id: string) => {
    const updated = recurringTransactions.filter(r => r.id !== id);
    setRecurringTransactions(updated);
    await localforage.setItem('recurringTransactions', updated);
  };

  const toggleRecurringActive = async (id: string) => {
    const updated = recurringTransactions.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRecurringTransactions(updated);
    await localforage.setItem('recurringTransactions', updated);
  };

  const processRecurringTransactions = async () => {
    return await processRecurringInternal(transactions, recurringTransactions);
  };

  const exportData = () => {
    const data = {
      transactions,
      categories,
      paymentMethods,
      recurringTransactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_spese_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.transactions) {
        setTransactions(parsed.transactions);
        await localforage.setItem('transactions', parsed.transactions);
      }
      if (parsed.categories) {
        setCategories(parsed.categories);
        await localforage.setItem('categories', parsed.categories);
      }
      if (parsed.paymentMethods) {
        setPaymentMethods(parsed.paymentMethods);
        await localforage.setItem('paymentMethods', parsed.paymentMethods);
      }
      if (parsed.recurringTransactions) {
        setRecurringTransactions(parsed.recurringTransactions);
        await localforage.setItem('recurringTransactions', parsed.recurringTransactions);
      }
    } catch (e) {
      console.error("Invalid JSON format", e);
      throw new Error("Formato JSON non valido");
    }
  };

  return (
    <DataContext.Provider value={{
      transactions, categories, paymentMethods, recurringTransactions, isLoading,
      newlyGeneratedCount, clearNewlyGeneratedCount,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction,
      toggleRecurringActive, processRecurringTransactions,
      exportData, importData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
