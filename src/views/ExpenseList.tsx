import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Search, Upload, Pencil, Repeat } from 'lucide-react';
import type { Transaction } from '../types';

interface ExpenseListProps {
  onEdit?: (transaction: Transaction) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ onEdit }) => {
  const { transactions, categories, paymentMethods, deleteTransaction, isLoading, exportData, importData } = useData();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterCategory]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sconosciuta';
  const getPaymentName = (id: string) => paymentMethods.find(p => p.id === id)?.name || 'Sconosciuto';

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa voce?')) {
      await deleteTransaction(id);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importData(text);
      alert('Dati importati con successo!');
    } catch (err) {
      alert('Errore durante l\'importazione: formato non valido');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    const headers = ['Data', 'Descrizione', 'Tipo', 'Categoria', 'Metodo di Pagamento', 'Importo'];
    
    const csvRows = transactions.map(t => {
      const date = format(parseISO(t.date), 'dd/MM/yyyy');
      const description = `"${t.description.replace(/"/g, '""')}"`;
      const type = t.type === 'spesa' ? 'Spesa' : 'Ricavo';
      const category = `"${getCategoryName(t.categoryId).replace(/"/g, '""')}"`;
      const paymentMethod = `"${getPaymentName(t.paymentMethodId).replace(/"/g, '""')}"`;
      // Convert number to string with comma as decimal separator for Italian Excel
      const amount = Math.abs(t.amount).toFixed(2).replace('.', ',');

      return [date, description, type, category, paymentMethod, amount].join(';');
    });

    const csvContent = [headers.join(';'), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esportazione_spese_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div className="form-group" style={{ marginBottom: '0.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Cerca nelle descrizioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            className="form-control" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">Tutti i tipi</option>
            <option value="spesa">Solo Spese</option>
            <option value="ricavo">Solo Ricavi</option>
          </select>
          <select 
            className="form-control" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">Tutte le cat.</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Storico Movimenti</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="file" 
            accept=".json" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Importa
          </button>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={exportData}>
            Backup JSON
          </button>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={handleExportCSV}>
            Esporta CSV
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          Nessun movimento trovato.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTransactions.map(t => (
            <div key={t.id} className="card" style={{ padding: '1rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="font-semibold" style={{ fontSize: '0.9rem' }}>{t.description}</span>
                    {(t.recurringId || t.isAutoGenerated) && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--color-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }} title="Voce generata automaticamente da spesa ricorrente">
                        <Repeat size={10} /> Ricorrente
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${t.type === 'spesa' ? 'text-danger' : 'text-success'}`}>
                    {t.type === 'spesa' ? '-' : '+'}€{Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{format(parseISO(t.date), 'dd MMM yyyy', { locale: it })}</span>
                  <span>•</span>
                  <span>{getCategoryName(t.categoryId)}</span>
                  <span>•</span>
                  <span>{getPaymentName(t.paymentMethodId)}</span>
                </div>
                {t.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {t.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                <button className="btn-icon" onClick={() => onEdit?.(t)} style={{ color: 'var(--color-primary)' }}>
                  <Pencil size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(t.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

