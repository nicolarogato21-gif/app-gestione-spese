import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  PlusCircle, 
  Tags, 
  CreditCard, 
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';
import { ExpenseList } from '../views/ExpenseList';
import { ExpenseForm } from '../views/ExpenseForm';
import { Categories } from '../views/Categories';
import { PaymentMethods } from '../views/PaymentMethods';
import { Statistics } from '../views/Statistics';
import type { Transaction } from '../types';

type ViewState = 'list' | 'new' | 'edit' | 'categories' | 'payments' | 'stats';

export const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('list');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const renderView = () => {
    switch (activeView) {
      case 'list': return <ExpenseList onEdit={(t) => { setEditingTransaction(t); setActiveView('edit'); }} />;
      case 'new': return <ExpenseForm onSuccess={() => setActiveView('list')} />;
      case 'edit': return <ExpenseForm initialData={editingTransaction} onSuccess={() => { setEditingTransaction(null); setActiveView('list'); }} />;
      case 'categories': return <Categories />;
      case 'payments': return <PaymentMethods />;
      case 'stats': return <Statistics />;
      default: return <ExpenseList onEdit={(t) => { setEditingTransaction(t); setActiveView('edit'); }} />;
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'list': return 'Spese e Ricavi';
      case 'new': return 'Nuova Voce';
      case 'edit': return 'Modifica Voce';
      case 'categories': return 'Categorie';
      case 'payments': return 'Metodi di Pagamento';
      case 'stats': return 'Statistiche';
      default: return 'App';
    }
  };

  return (
    <div className="app-container">
      <header style={{ 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{getTitle()}</h1>
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="main-content">
        {renderView()}
      </main>

      <nav className="bottom-nav">
        <a href="#" className={`nav-item ${activeView === 'list' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('list'); }}>
          <Receipt size={24} />
          <span>Elenco</span>
        </a>
        <a href="#" className={`nav-item ${activeView === 'new' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('new'); }}>
          <PlusCircle size={24} />
          <span>Nuova</span>
        </a>
        <a href="#" className={`nav-item ${activeView === 'categories' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('categories'); }}>
          <Tags size={24} />
          <span>Categorie</span>
        </a>
        <a href="#" className={`nav-item ${activeView === 'payments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('payments'); }}>
          <CreditCard size={24} />
          <span>Metodi</span>
        </a>
        <a href="#" className={`nav-item ${activeView === 'stats' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('stats'); }}>
          <BarChart3 size={24} />
          <span>Statistiche</span>
        </a>
      </nav>
    </div>
  );
};
