import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { RecurringTransaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Pencil, Trash2, Repeat, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

export const RecurringList: React.FC = () => {
  const {
    recurringTransactions,
    categories,
    paymentMethods,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringActive,
    processRecurringTransactions,
    isLoading
  } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('spesa');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  const openForm = (item?: RecurringTransaction) => {
    if (item) {
      setEditingItem(item);
      setDescription(item.description);
      setAmount(item.amount.toString());
      setType(item.type);
      setCategoryId(item.categoryId);
      setPaymentMethodId(item.paymentMethodId);
      setDayOfMonth(item.dayOfMonth || 1);
      setNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setDescription('');
      setAmount('');
      setType('spesa');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setPaymentMethodId(paymentMethods.length > 0 ? paymentMethods[0].id : '');
      setDayOfMonth(1);
      setNotes('');
    }
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId || !paymentMethodId) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("L'importo deve essere un numero valido maggiore di 0.");
      return;
    }

    const newItem: RecurringTransaction = {
      id: editingItem?.id || uuidv4(),
      description,
      amount: numAmount,
      type,
      categoryId,
      paymentMethodId,
      dayOfMonth: Number(dayOfMonth),
      active: editingItem ? editingItem.active : true,
      notes,
      lastGeneratedYearMonth: editingItem?.lastGeneratedYearMonth
    };

    if (editingItem) {
      await updateRecurringTransaction(newItem);
    } else {
      await addRecurringTransaction(newItem);
    }

    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa regola di spesa ricorrente?")) {
      await deleteRecurringTransaction(id);
    }
  };

  const handleManualProcess = async () => {
    const generated = await processRecurringTransactions();
    if (generated > 0) {
      setProcessMessage(`Generate con successo ${generated} nuove voci per il mese corrente!`);
    } else {
      setProcessMessage("Tutte le spese ricorrenti attive risultano già generate per questo mese.");
    }
    setTimeout(() => setProcessMessage(null), 4000);
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sconosciuta';
  const getPaymentName = (id: string) => paymentMethods.find(p => p.id === id)?.name || 'Sconosciuto';

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Repeat size={20} style={{ color: 'var(--color-primary)' }} /> Spese & Ricavi Ricorrenti
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Gestisci abbonamenti e spese fisse che si aggiungono automaticamente ogni mese. Puoi modificarne l'importo standard in qualsiasi momento.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Nuova Ricorrenza
          </button>
          <button className="btn btn-outline" onClick={handleManualProcess} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlayCircle size={18} /> Verifica & Genera Mese
          </button>
        </div>

        {processMessage && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: 'var(--color-success)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} />
            {processMessage}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            {editingItem ? 'Modifica Spesa Ricorrente' : 'Nuova Spesa Ricorrente'}
          </h3>
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
              <label className="form-label">Descrizione / Nome Servizio</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Es. Canone Netflix, Affitto, Palestra..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Importo Predefinito (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="12.99"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Giorno del Mese (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                  required
                />
              </div>
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
                rows={2}
                placeholder="Dettagli abbonamento o istruzioni..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeForm}>
                Annulla
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                Salva Ricorrenza
              </button>
            </div>
          </form>
        </div>
      )}

      {recurringTransactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <AlertCircle size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Nessuna spesa o ricavo ricorrente impostato.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Aggiungi il tuo primo abbonamento (es. Netflix, Affitto) con il pulsante in alto.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recurringTransactions.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '1rem',
                margin: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: item.active ? 1 : 0.6,
                borderLeft: `4px solid ${item.type === 'spesa' ? 'var(--color-danger)' : 'var(--color-success)'}`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="font-semibold" style={{ fontSize: '0.95rem' }}>{item.description}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '12px',
                      backgroundColor: item.active ? 'rgba(34, 197, 94, 0.15)' : 'var(--color-bg-secondary)',
                      color: item.active ? 'var(--color-success)' : 'var(--color-text-muted)'
                    }}
                  >
                    {item.active ? 'Attivo' : 'Pausa'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  Ogni giorno <strong>{item.dayOfMonth}</strong> del mese • <span className={`font-bold ${item.type === 'spesa' ? 'text-danger' : 'text-success'}`}>
                    {item.type === 'spesa' ? '-' : '+'}€{item.amount.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{getCategoryName(item.categoryId)}</span>
                  <span>•</span>
                  <span>{getPaymentName(item.paymentMethodId)}</span>
                </div>

                {item.notes && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {item.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => toggleRecurringActive(item.id)}
                >
                  {item.active ? 'Pausa' : 'Attiva'}
                </button>
                <button className="btn-icon" onClick={() => openForm(item)} style={{ color: 'var(--color-primary)' }}>
                  <Pencil size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(item.id)}>
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
