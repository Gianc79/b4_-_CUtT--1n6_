import React from 'react';
import { MasterRow } from '../types';
import { fmt, inputNumber, unitWeight, validDiameter } from '../utils/math';

interface ItemCardProps {
  row: MasterRow;
  index: number;
  onUpdate: (updated: Partial<MasterRow>) => void;
  onDelete: () => void;
  onValidateField: (field: 'diameter' | 'qty' | 'length', val: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  row,
  index,
  onUpdate,
  onDelete,
  onValidateField,
}) => {
  const d = inputNumber(row.diameter);
  const q = inputNumber(row.qty);
  const l = inputNumber(row.length);

  const isValid =
    validDiameter(d) &&
    Number.isInteger(q) &&
    q! > 0 &&
    q! <= 10000 &&
    Number.isInteger(l) &&
    l! > 0 &&
    l! <= 1200;

  const weight = isValid ? ((q! * l!) / 100) * unitWeight(d) : 0;
  const singleWeight = d && l && validDiameter(d) ? (l / 100) * unitWeight(d) : 0;

  const handleStepQty = (delta: number) => {
    const current = q || 0;
    const next = Math.max(1, Math.min(10000, current + delta));
    onUpdate({ qty: String(next) });
  };

  return (
    <div className={`rebar-item-card ${isValid ? 'card-valid' : 'card-incomplete'}`}>
      <div className="card-top-row">
        <div className="card-dia-tag">
          <input
            className="card-dia-input"
            type="number"
            min="6"
            max="40"
            step="2"
            inputMode="numeric"
            value={row.diameter}
            placeholder="Ø"
            aria-label={`Diametro riga ${index + 1}`}
            onChange={e => onUpdate({ diameter: e.target.value })}
            onBlur={e => onValidateField('diameter', e.target.value)}
          />
          <span className="card-dia-unit">mm</span>
        </div>

        <div className="card-length-group">
          <label className="card-mini-label">Lunghezza</label>
          <div className="card-length-input-wrap">
            <input
              className="card-length-input"
              type="number"
              min="1"
              max="1200"
              step="1"
              inputMode="numeric"
              value={row.length}
              placeholder="cm"
              aria-label={`Lunghezza riga ${index + 1}`}
              onChange={e => onUpdate({ length: e.target.value })}
              onBlur={e => onValidateField('length', e.target.value)}
            />
            <span className="card-length-unit">cm</span>
          </div>
          {l && l > 0 && <span className="card-m-equiv">({fmt(l / 100)} m)</span>}
        </div>

        <button
          type="button"
          className="card-delete-btn"
          onClick={onDelete}
          aria-label={`Elimina riga ${index + 1}`}
          title="Elimina"
        >
          ✕
        </button>
      </div>

      <div className="card-bottom-row">
        <div className="card-stepper-group">
          <label className="card-mini-label">Quantità (Nr.)</label>
          <div className="card-stepper">
            <button
              type="button"
              className="stepper-btn stepper-minus"
              onClick={() => handleStepQty(-1)}
              aria-label="Diminuisci quantità"
            >
              −
            </button>
            <input
              className="card-qty-input"
              type="number"
              min="1"
              max="10000"
              step="1"
              inputMode="numeric"
              value={row.qty}
              placeholder="Pezzi"
              aria-label={`Quantità riga ${index + 1}`}
              onChange={e => onUpdate({ qty: e.target.value })}
              onBlur={e => onValidateField('qty', e.target.value)}
            />
            <button
              type="button"
              className="stepper-btn stepper-plus"
              onClick={() => handleStepQty(+1)}
              aria-label="Aumenta quantità"
            >
              ＋
            </button>
          </div>
        </div>

        <div className="card-weight-display">
          <div className="card-mini-label">Peso calcolato</div>
          <div className="card-weight-val">
            <strong>{weight > 0 ? fmt(weight) : '—'}</strong>
            <span className="weight-unit"> kg</span>
          </div>
          {singleWeight > 0 && (
            <div className="card-weight-sub">
              {fmt(singleWeight)} kg/pz
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
