import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export const Statistics: React.FC = () => {
  const { transactions, categories } = useData();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = transactions.map(t => getYear(parseISO(t.date)));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [transactions]);

  // Pivot 1: Year-Month (Tutti gli anni)
  const pivot1Data = useMemo(() => {
    const monthsData: Record<string, { year: number, monthIdx: number, monthName: string, spese: number, ricavi: number, netto: number }> = {};

    transactions.forEach(t => {
      const date = parseISO(t.date);
      const year = getYear(date);
      const month = getMonth(date);
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthsData[key]) {
        monthsData[key] = {
          year,
          monthIdx: month,
          monthName: format(new Date(year, month, 1), 'MMM yy', { locale: it }),
          spese: 0,
          ricavi: 0,
          netto: 0
        };
      }
      
      if (t.type === 'spesa') {
        monthsData[key].spese += t.amount;
        monthsData[key].netto -= t.amount;
      } else {
        monthsData[key].ricavi += t.amount;
        monthsData[key].netto += t.amount;
      }
    });

    return Object.values(monthsData)
      .sort((a, b) => b.year - a.year || b.monthIdx - a.monthIdx);
  }, [transactions]);

  // Pivot 2: Category by Year
  const pivot2Data = useMemo(() => {
    const catData: Record<string, number> = {};
    categories.forEach(c => catData[c.id] = 0);

    transactions.forEach(t => {
      const date = parseISO(t.date);
      if (getYear(date) === selectedYear && t.type === 'spesa') {
        if (catData[t.categoryId] !== undefined) {
          catData[t.categoryId] += t.amount;
        } else {
          catData[t.categoryId] = t.amount;
        }
      }
    });

    return Object.keys(catData)
      .map(catId => ({
        categoryId: catId,
        categoryName: categories.find(c => c.id === catId)?.name || 'Sconosciuta',
        totale: catData[catId]
      }))
      .filter(d => d.totale > 0)
      .sort((a, b) => b.totale - a.totale);
  }, [transactions, categories, selectedYear]);

  // Pivot 3: Totals by Year
  const pivot3Data = useMemo(() => {
    const yearsData: Record<number, { spese: number, ricavi: number, netto: number }> = {};
    
    availableYears.forEach(y => {
      yearsData[y] = { spese: 0, ricavi: 0, netto: 0 };
    });

    transactions.forEach(t => {
      const year = getYear(parseISO(t.date));
      if (t.type === 'spesa') {
        yearsData[year].spese += t.amount;
        yearsData[year].netto -= t.amount;
      } else {
        yearsData[year].ricavi += t.amount;
        yearsData[year].netto += t.amount;
      }
    });

    return availableYears.map(y => ({
      year: y,
      ...yearsData[y]
    }));
  }, [transactions, availableYears]);

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Statistiche</h2>
        <select 
          className="form-control" 
          style={{ width: 'auto' }}
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {availableYears.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Riepilogo Annuo (Tutti gli anni)</h3>
        {pivot3Data.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center' }}>Nessun dato presente.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>Anno</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-danger)' }}>Spese</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-success)' }}>Ricavi</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Netto</th>
              </tr>
            </thead>
            <tbody>
              {pivot3Data.map(row => (
                <tr key={row.year} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 0' }} className="font-semibold">{row.year}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>€{row.spese.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>€{row.ricavi.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }} className={`font-bold ${row.netto > 0 ? 'text-success' : row.netto < 0 ? 'text-danger' : ''}`}>
                    €{row.netto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-card)', zIndex: 1 }}>Riepilogo Mensile (Storico)</h3>
        {pivot1Data.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center' }}>Nessun dato.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead style={{ position: 'sticky', top: '1.5rem', backgroundColor: 'var(--color-bg-card)', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.25rem 0' }}>Mese</th>
                <th style={{ padding: '0.25rem 0', textAlign: 'right', color: 'var(--color-danger)' }}>Spese</th>
                <th style={{ padding: '0.25rem 0', textAlign: 'right', color: 'var(--color-success)' }}>Ricavi</th>
                <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>Netto</th>
              </tr>
            </thead>
            <tbody>
              {pivot1Data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.25rem 0', textTransform: 'capitalize' }} className="font-semibold">{row.monthName}</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>€{row.spese.toFixed(2)}</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>€{row.ricavi.toFixed(2)}</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }} className={`font-bold ${row.netto > 0 ? 'text-success' : row.netto < 0 ? 'text-danger' : ''}`}>
                    €{row.netto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Spese per Categoria ({selectedYear})</h3>
        {pivot2Data.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center' }}>Nessuna spesa per questo anno.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>Categoria</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Totale Anno</th>
              </tr>
            </thead>
            <tbody>
              {pivot2Data.map(row => (
                <tr key={row.categoryId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 0' }} className="font-semibold">{row.categoryName}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-danger)' }} className="font-bold">
                    €{row.totale.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
