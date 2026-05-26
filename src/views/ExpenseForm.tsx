import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import type { Transaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

interface ExpenseFormProps {
  onSuccess: () => void;
  initialData?: Transaction | null;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, initialData }) => {
  const { categories, paymentMethods, addTransaction, updateTransaction, transactions } = useData();
  
  const [type, setType] = useState<TransactionType>(initialData?.type || 'spesa');
  const [date, setDate] = useState(initialData?.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories.length > 0 ? categories[0].id : ''));
  const [paymentMethodId, setPaymentMethodId] = useState(initialData?.paymentMethodId || (paymentMethods.length > 0 ? paymentMethods[0].id : ''));
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Smart autocomplete based on past descriptions
  useEffect(() => {
    if (description.length > 1) {
      const pastDescs = transactions
        .map(t => t.description)
        .filter(d => d.toLowerCase().includes(description.toLowerCase()) && d.toLowerCase() !== description.toLowerCase());
      const unique = Array.from(new Set(pastDescs)).slice(0, 3);
      setSuggestions(unique);
    } else {
      setSuggestions([]);
    }
  }, [description, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !paymentMethodId || !description || !amount) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("L'importo deve essere un numero valido maggiore di 0.");
      return;
    }

    const newTransaction: Transaction = {
      id: initialData?.id || uuidv4(),
      date,
      type,
      categoryId,
      paymentMethodId,
      description,
      amount: numAmount,
      notes
    };

    if (initialData) {
      await updateTransaction(newTransaction);
    } else {
      await addTransaction(newTransaction);
    }
    
    onSuccess();
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>{initialData ? 'Modifica Voce' : 'Aggiungi Nuova Voce'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="toggle-container">
            <button
              type="button"
              className={`toggle-btn ${type === 'spesa' ? 'active expense' : ''}`}
              onClick={() => setType('spesa')}
            >
              Spesa
            </button>
            <button
              type="button"
              className={`toggle-btn ${type === 'ricavo' ? 'active income' : ''}`}
              onClick={() => setType('ricavo')}
            >
              Ricavo
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Data</label>
          <input 
            type="date" 
            className="form-control" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required
          />
        </div>

        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Descrizione</label>
          <input 
            type="text" 
            className="form-control" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Spesa supermercato"
            required
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%', left: 0, right: 0,
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 10,
              marginTop: '4px'
            }}>
              {suggestions.map((s, i) => (
                <div 
                  key={i} 
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDescription(s);
                    setSuggestions([]);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setDescription(s);
                    setSuggestions([]);
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Importo (€)</label>
          <input 
            type="number" 
            step="0.01"
            className="form-control" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select 
            className="form-control" 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Metodo di Pagamento</label>
          <select 
            className="form-control" 
            value={paymentMethodId} 
            onChange={(e) => setPaymentMethodId(e.target.value)}
            required
          >
            {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Note (opzionale)</label>
          <textarea 
            className="form-control" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Dettagli aggiuntivi..."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onSuccess}>
            Annulla
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
            Salva
          </button>
        </div>
      </form>
    </div>
  );
};
