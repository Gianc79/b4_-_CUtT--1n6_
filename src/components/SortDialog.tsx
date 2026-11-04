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

  const handleDirectionChange = (index: number, direction: 'asc' | 'desc') => {
    const updated = [...levels];
    updated[index].direction = direction;
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
    <dialog
      className="sort-dialog"
      open
      style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
    >
      <form onSubmit={handleSubmit}>
        <div className="sort-dialog-head">
          <h3>{kind === 'stockDetail' ? 'Ordina Giacenza' : 'Ordina Richiesta'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Chiudi finestra">
            ×
          </button>
        </div>
        <div className="sort-level-grid-head" aria-hidden="true">
          <span></span>
          <span>Campo</span>
          <span>Ordine</span>
        </div>
        <div className="sort-levels">
          {levels.map((level, index) => {
            const usedElsewhere = new Set(levels.filter((_, i) => i !== index).map(l => l.field));
            const options = SORT_FIELDS.filter(f => !usedElsewhere.has(f.value) || f.value === level.field);
            return (
              <div key={index} className="sort-level-row">
                <label>{index === 0 ? 'Ordina per:' : 'Quindi per:'}</label>
                <select
                  value={level.field}
                  onChange={e => handleFieldChange(index, e.target.value as any)}
                  aria-label={`Campo livello ${index + 1}`}
                >
                  {options.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={level.direction}
                  onChange={e => handleDirectionChange(index, e.target.value as any)}
                  aria-label={`Ordine livello ${index + 1}`}
                >
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </div>
            );
          })}
        </div>
        <div className="sort-level-buttons">
          <button
            type="button"
            className="btn neutral"
            onClick={handleAddLevel}
            disabled={levels.length >= SORT_FIELDS.length}
          >
            ＋ Aggiungi livello
          </button>
          <button
            type="button"
            className="btn neutral"
            onClick={handleRemoveLevel}
            disabled={levels.length <= 1}
          >
            − Elimina livello
          </button>
        </div>
        <div className="sort-dialog-actions">
          <button type="button" className="btn neutral" onClick={onClose}>
            Annulla
          </button>
          <button type="submit" className="btn primary">
            Ordina
          </button>
        </div>
      </form>
    </dialog>
  );
};
