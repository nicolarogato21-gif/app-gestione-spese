import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus } from 'lucide-react';
import type { PaymentMethod } from '../types';

export const PaymentMethods: React.FC = () => {
  const { paymentMethods, addPaymentMethod, deletePaymentMethod } = useData();
  const [newName, setNewName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMethod: PaymentMethod = {
      id: uuidv4(),
      name: newName.trim()
    };

    await addPaymentMethod(newMethod);
    setNewName('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminando il metodo, le voci ad esso collegate manterranno l\'ID ma perderanno il nome. Sicuro di voler continuare?')) {
      await deletePaymentMethod(id);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Metodi di Pagamento</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nuovo metodo (es. Satispay)..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1rem' }}>
            <Plus size={20} />
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>I tuoi Metodi</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {paymentMethods.map(p => (
            <div key={p.id} className="list-item">
              <span className="font-semibold">{p.name}</span>
              <button className="btn-icon text-danger" onClick={() => handleDelete(p.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <div style={{ padding: '1rem 0', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Nessun metodo presente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
