import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus } from 'lucide-react';
import type { Category } from '../types';

export const Categories: React.FC = () => {
  const { categories, addCategory, deleteCategory } = useData();
  const [newName, setNewName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCategory: Category = {
      id: uuidv4(),
      name: newName.trim()
    };

    await addCategory(newCategory);
    setNewName('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminando la categoria, le voci ad essa collegate manterranno l\'ID ma perderanno il nome. Sicuro di voler continuare?')) {
      await deleteCategory(id);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Gestione Categorie</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nuova categoria..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1rem' }}>
            <Plus size={20} />
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Le tue Categorie</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {categories.map(c => (
            <div key={c.id} className="list-item">
              <span className="font-semibold">{c.name}</span>
              <button className="btn-icon text-danger" onClick={() => handleDelete(c.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ padding: '1rem 0', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Nessuna categoria presente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
