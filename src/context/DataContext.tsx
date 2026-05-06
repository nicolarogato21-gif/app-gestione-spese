import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import localforage from 'localforage';
import type { AppState, Category, PaymentMethod, Transaction } from '../types';

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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTransactions = await localforage.getItem<Transaction[]>('transactions');
        const storedCategories = await localforage.getItem<Category[]>('categories');
        const storedPaymentMethods = await localforage.getItem<PaymentMethod[]>('paymentMethods');

        setTransactions(storedTransactions || []);
        
        if (storedCategories && storedCategories.length > 0) {
          // Aggiornamento forzato se non è presente una delle nuove (es. "Assicurazioni")
          if (!storedCategories.some(c => c.name === 'Assicurazioni')) {
            setCategories(defaultCategories);
            await localforage.setItem('categories', defaultCategories);
          } else {
            setCategories(storedCategories);
          }
        } else {
          setCategories(defaultCategories);
          await localforage.setItem('categories', defaultCategories);
        }

        if (storedPaymentMethods && storedPaymentMethods.length > 0) {
          // Aggiornamento forzato se non è presente uno dei nuovi metodi (es. "Carta 1680")
          if (!storedPaymentMethods.some(p => p.name === 'Carta 1680')) {
            setPaymentMethods(defaultPaymentMethods);
            await localforage.setItem('paymentMethods', defaultPaymentMethods);
          } else {
            setPaymentMethods(storedPaymentMethods);
          }
        } else {
          setPaymentMethods(defaultPaymentMethods);
          await localforage.setItem('paymentMethods', defaultPaymentMethods);
        }
      } catch (error) {
        console.error("Failed to load data from localforage", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  const exportData = () => {
    const data = {
      transactions,
      categories,
      paymentMethods
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
    } catch (e) {
      console.error("Invalid JSON format", e);
      throw new Error("Formato JSON non valido");
    }
  };

  return (
    <DataContext.Provider value={{
      transactions, categories, paymentMethods, isLoading,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
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
