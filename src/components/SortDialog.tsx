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
    <div className="in-app-modal-backdrop" onClick={onClose}>
      <div
        className="sort-dialog-card-v2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sort-title"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="sort-dialog-head">
            <h3 id="sort-title">{kind === 'stockDetail' ? 'Ordina Giacenza' : 'Ordina Richiesta'}</h3>
            <button
              type="button"
              className="in-app-modal-close"
              onClick={onClose}
              aria-label="Chiudi finestra"
            >
              ×
            </button>
          </div>

          <div className="sort-levels-container">
            {levels.map((level, index) => {
              const usedElsewhere = new Set(
                levels.filter((_, i) => i !== index).map(l => l.field)
              );
              const options = SORT_FIELDS.filter(
                f => !usedElsewhere.has(f.value) || f.value === level.field
              );
              const isAsc = level.direction === 'asc';

              return (
                <div key={index} className="sort-level-row-v2">
                  <span className="sort-level-label">
                    {index === 0 ? 'Ordina per:' : 'Quindi per:'}
                  </span>

                  {/* Campo con larghezza abbondante per farci stare tutta la scritta Lunghezza [cm] */}
                  <select
                    className="sort-field-select"
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

                  {/* Icona pulsante AZ con freccia in giù (crescente) / ZA con freccia in giù (decrescente) */}
                  <button
                    type="button"
                    className={`sort-direction-btn ${isAsc ? 'is-asc' : 'is-desc'}`}
                    onClick={() => handleToggleDirection(index)}
                    title={isAsc ? 'Crescente (AZ ↓) - Clicca per invertire' : 'Decrescente (ZA ↓) - Clicca per invertire'}
                    aria-label={isAsc ? 'Ordine crescente' : 'Ordine decrescente'}
                  >
                    <span className="sort-dir-text">{isAsc ? 'A-Z' : 'Z-A'}</span>
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 3a.75.75 0 01.75.75v10.69l3.72-3.72a.75.75 0 111.06 1.06l-5 5a.75.75 0 01-1.06 0l-5-5a.75.75 0 111.06-1.06l3.72 3.72V3.75A.75.75 0 0110 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="sort-level-buttons">
            <button
              type="button"
              className="btn neutral small"
              onClick={handleAddLevel}
              disabled={levels.length >= SORT_FIELDS.length}
            >
              ＋ Aggiungi livello
            </button>
            <button
              type="button"
              className="btn neutral small"
              onClick={handleRemoveLevel}
              disabled={levels.length <= 1}
            >
              − Elimina livello
            </button>
          </div>

          {/* Pulsanti Annulla e Ordina con stessa larghezza aumentata e font più grande */}
          <div className="sort-dialog-actions-v2">
            <button
              type="button"
              className="btn neutral sort-action-btn"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn primary sort-action-btn"
            >
              Ordina
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
