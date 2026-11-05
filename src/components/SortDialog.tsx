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
    <div className="in-app-modal-backdrop sort-dialog-backdrop" onClick={onClose}>
      <div
        className="sort-dialog-card-v3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sort-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        {/* X di chiusura rigorosamente nell'angolo in alto a destra */}
        <button
          type="button"
          className="sort-dialog-close-topright"
          onClick={onClose}
          aria-label="Chiudi finestra"
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <div className="sort-dialog-header-clean">
            <h3 id="sort-dialog-title">
              {kind === 'stockDetail' ? 'Ordina Giacenza' : 'Ordina Richiesta'}
            </h3>
          </div>

          <div className="sort-levels-list">
            {levels.map((level, index) => {
              const usedElsewhere = new Set(
                levels.filter((_, i) => i !== index).map(l => l.field)
              );
              const options = SORT_FIELDS.filter(
                f => !usedElsewhere.has(f.value) || f.value === level.field
              );
              const isAsc = level.direction === 'asc';

              return (
                <div key={index} className="sort-level-item">
                  {/* Etichetta con font più grande */}
                  <span className="sort-item-label">
                    {index === 0 ? 'Ordina per:' : 'Quindi per:'}
                  </span>

                  {/* Casella Campo dimensionata proporzionatamente */}
                  <select
                    className="sort-item-select"
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

                  {/* Pulsante Direzione AZ / ZA */}
                  <button
                    type="button"
                    className={`sort-item-dir-btn ${isAsc ? 'is-asc' : 'is-desc'}`}
                    onClick={() => handleToggleDirection(index)}
                    title={isAsc ? 'Crescente (A-Z ↓)' : 'Decrescente (Z-A ↓)'}
                    aria-label={isAsc ? 'Ordine crescente' : 'Ordine decrescente'}
                  >
                    <span className="dir-text">{isAsc ? 'A-Z' : 'Z-A'}</span>
                    <span className="dir-arrow">↓</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pulsanti Aggiungi ed Elimina livello ben distanziati */}
          <div className="sort-level-actions-group">
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

          {/* Azioni finali Annulla e Ordina con stessa larghezza e font 14px */}
          <div className="sort-dialog-bottom-actions">
            <button
              type="button"
              className="btn neutral modal-btn-large"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn primary modal-btn-large"
            >
              Ordina
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
