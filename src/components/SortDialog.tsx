import React, { useState, useEffect } from 'react';
import { SortLevel } from '../types';

interface SortDialogProps {
  isOpen: boolean;
  kind: 'stockDetail' | 'demandDetail';
  onClose: () => void;
  onApplySort: (levels: SortLevel[]) => void;
}

const SORT_FIELDS = [
  { value: 'diameter' as const, label: 'Diametro [mm]' },
  { value: 'qty' as const, label: 'Nr.' },
  { value: 'length' as const, label: 'Lunghezza [cm]' },
];

/**
 * Icona ordinamento fedele al file "Ordinamento crescente.jpg":
 * Freccia rivolta verso il basso a sinistra e 4 barre orizzontali a destra.
 */
const SortBarsOrderIcon: React.FC<{ isAsc: boolean }> = ({ isAsc }) => {
  return (
    <svg viewBox="0 0 36 32" width="24" height="22" fill="none" style={{ display: 'block' }}>
      <path
        d="M7 4v20m0 0l-4-4.5M7 24l4-4.5"
        stroke="#475569"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isAsc ? (
        <>
          <rect x="15" y="4" width="7" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="10.5" width="11" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="17" width="15" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="23.5" width="19" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        </>
      ) : (
        <>
          <rect x="15" y="4" width="19" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="10.5" width="15" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="17" width="11" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="15" y="23.5" width="7" height="4" rx="1" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        </>
      )}
    </svg>
  );
};

export const SortDialog: React.FC<SortDialogProps> = ({
  isOpen,
  kind,
  onClose,
  onApplySort,
}) => {
  const [levels, setLevels] = useState<SortLevel[]>([{ field: 'diameter', direction: 'desc' }]);

  useEffect(() => {
    if (isOpen) {
      setLevels([{ field: 'diameter', direction: 'desc' }]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, field: 'diameter' | 'qty' | 'length') => {
    const updated = [...levels];
    updated[index].field = field;
    setLevels(updated);
  };

  const handleToggleDirection = (index: number) => {
    const updated = [...levels];
    updated[index].direction = updated[index].direction === 'asc' ? 'desc' : 'asc';
    setLevels(updated);
  };

  const handleAddLevel = () => {
    if (levels.length >= SORT_FIELDS.length) return;
    const usedFields = new Set(levels.map(l => l.field));
    const available = SORT_FIELDS.find(f => !usedFields.has(f.value));
    if (available) {
      setLevels([...levels, { field: available.value, direction: 'desc' }]);
    }
  };

  const handleRemoveLevel = () => {
    if (levels.length > 1) {
      setLevels(levels.slice(0, -1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySort(levels);
    onClose();
  };

  return (
    <div className="in-app-modal-backdrop sort-dialog-backdrop" onClick={onClose}>
      <div
        className="sort-dialog-card-v4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sort-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Titolo e X allineati verticalmente sulla stessa riga in alto */}
          <div className="sort-dialog-head-v4">
            <h3 id="sort-dialog-title" className="sort-dialog-title-v4">
              {kind === 'stockDetail' ? 'Ordina Giacenza' : 'Ordina Richiesta'}
            </h3>
            <button
              type="button"
              className="sort-dialog-close-v4"
              onClick={onClose}
              aria-label="Chiudi finestra"
            >
              ×
            </button>
          </div>

          {/* Lista livelli: casella select spostata più a sx vicino all'etichetta per visualizzare tutto il testo */}
          <div className="sort-levels-list-v4">
            {levels.map((level, index) => {
              const usedElsewhere = new Set(
                levels.filter((_, i) => i !== index).map(l => l.field)
              );
              const options = SORT_FIELDS.filter(
                f => !usedElsewhere.has(f.value) || f.value === level.field
              );
              const isAsc = level.direction === 'asc';

              return (
                <div key={index} className="sort-level-item-v4-compact">
                  <span className="sort-item-label-compact">
                    {index === 0 ? 'Ordina per:' : 'Quindi per:'}
                  </span>

                  {/* Casella allargata verso sx */}
                  <select
                    className="sort-item-select-v4-expanded"
                    value={level.field}
                    onChange={e => handleFieldChange(index, e.target.value as any)}
                    aria-label={`Campo ordinamento livello ${index + 1}`}
                  >
                    {options.map(f => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {/* Icona ordinamento fedele */}
                  <button
                    type="button"
                    className="sort-item-bars-btn"
                    onClick={() => handleToggleDirection(index)}
                    title={isAsc ? 'Ordinamento crescente' : 'Ordinamento decrescente'}
                    aria-label={isAsc ? 'Ordinamento crescente' : 'Ordinamento decrescente'}
                  >
                    <SortBarsOrderIcon isAsc={isAsc} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* 5) Tasti Aggiungi ed Elimina livello su una sola riga con font e altezza ridotti */}
          <div className="sort-level-actions-group-v4">
            <button
              type="button"
              className="btn neutral sort-level-btn-compact"
              onClick={handleAddLevel}
              disabled={levels.length >= SORT_FIELDS.length}
            >
              ＋ Aggiungi livello
            </button>
            <button
              type="button"
              className="btn neutral sort-level-btn-compact"
              onClick={handleRemoveLevel}
              disabled={levels.length <= 1}
            >
              − Elimina livello
            </button>
          </div>

          {/* Azioni finali Annulla e Ordina distanziate */}
          <div className="sort-dialog-bottom-actions-v4">
            <button
              type="button"
              className="btn neutral sort-bottom-btn-wide"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn primary sort-bottom-btn-wide"
            >
              Ordina
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
