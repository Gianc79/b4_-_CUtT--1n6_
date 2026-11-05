import React, { useState, useRef, useEffect } from 'react';
import { MasterRow } from '../types';
import {
  blankMaster,
  fmt,
  inputNumber,
  newId,
  unitWeight,
  validDiameter,
} from '../utils/math';
import { DiameterFilter } from './DiameterFilter';
import { ConfirmModal } from './ConfirmModal';
import { ExcelImportIcon, ExcelExportIcon } from './ExcelIcons';

interface MasterTableProps {
  kind: 'stockDetail' | 'demandDetail';
  title: string;
  subtitle: string;
  rows: MasterRow[];
  onChangeRows: (rows: MasterRow[]) => void;
  onOpenSort: () => void;
  onImportXls: (file: File) => void;
  onExportXls: () => void;
  onToast: (msg: string) => void;
}

interface DuplicateCandidate {
  sourceRowId: string;
  targetRowId: string;
  addQty: number;
}

interface DeletedRowRecord {
  row: MasterRow;
  index: number;
}

/**
 * Icona "Tasto Ordina" fedele al file "Tasto Ordina.png":
 * Lettera A blu sopra, divisorio orizzontale viola, lettera Z viola sotto, e freccia grigia ↓ a destra.
 */
const SortTriggerIcon: React.FC = () => {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" className="sort-trigger-svg">
      {/* Colonna lettere A / Z */}
      <text
        x="9"
        y="12"
        fill="#2563EB"
        fontSize="12"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        A
      </text>
      <line x1="3" y1="15" x2="15" y2="15" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <text
        x="9"
        y="26"
        fill="#7C3AED"
        fontSize="12"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Z
      </text>

      {/* Freccia grigia rivolta in basso a destra */}
      <path
        d="M22 6v18m0 0l-4-4.5M22 24l4-4.5"
        stroke="#64748B"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MasterTable: React.FC<MasterTableProps> = ({
  kind,
  title,
  subtitle,
  rows,
  onChangeRows,
  onOpenSort,
  onImportXls,
  onExportXls,
  onToast,
}) => {
  const [selectedDiameter, setSelectedDiameter] = useState<number | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus management per immissione con Invio e scorrimento su nuova riga
  const nextFocusRowIdRef = useRef<string | null>(null);

  // Memorizzazione valore precedente per ripristino in caso di diametro errato
  const cellPreviousValuesRef = useRef<Record<string, string>>({});

  // Modali in-app
  const [invalidDiaModalOpen, setInvalidDiaModalOpen] = useState(false);
  const [clearTableModalOpen, setClearTableModalOpen] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);

  // Undo eliminazione riga
  const [deletedRecord, setDeletedRecord] = useState<DeletedRowRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // 4) Spostamento tabella in alto all'aggiunta di una riga per non finire dietro la tastiera mobile
  useEffect(() => {
    if (nextFocusRowIdRef.current) {
      const targetInput = document.querySelector<HTMLInputElement>(
        `input[data-row-id="${nextFocusRowIdRef.current}"][data-field="diameter"]`
      );
      if (targetInput) {
        targetInput.focus();
        try {
          targetInput.select();
        } catch (_) {}
        // Scorrimento al centro dell'area visibile
        targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      nextFocusRowIdRef.current = null;
    }
  }, [rows]);

  // Calcolo statistiche dinamiche (affiancate orizzontalmente)
  const isFiltered = selectedDiameter !== 'all';
  const effectiveRows = rows.filter(r => {
    if (!isFiltered) return true;
    return inputNumber(r.diameter) === selectedDiameter;
  });

  let statsMeters = 0;
  let statsWeight = 0;
  let statsPieces = 0;

  for (const r of effectiveRows) {
    const q = inputNumber(r.qty);
    const l = inputNumber(r.length);
    const d = inputNumber(r.diameter);
    if (validDiameter(d) && q && l && q > 0 && l > 0) {
      const m = (q * l) / 100;
      statsMeters += m;
      statsPieces += q;
      statsWeight += m * unitWeight(d!);
    }
  }

  // Gestione modifiche cella
  const handleCellChange = (id: string, field: 'diameter' | 'qty' | 'length', val: string) => {
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: val } : r));
    onChangeRows(updated);
  };

  // 3) Seleziona tutto il contenuto al clic senza menu contestuale
  const handleCellFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    id: string,
    field: 'diameter' | 'qty' | 'length',
    currentVal: string
  ) => {
    cellPreviousValuesRef.current[`${id}_${field}`] = currentVal;
    try {
      e.target.select();
    } catch (_) {}
  };

  const handleCellBlur = (id: string, field: 'diameter' | 'qty' | 'length', rawVal: string) => {
    const trimmed = rawVal.trim();
    const prevVal = cellPreviousValuesRef.current[`${id}_${field}`] || '';

    if (trimmed === '') return;

    const value = inputNumber(trimmed);

    if (field === 'diameter') {
      if (!validDiameter(value)) {
        // Ripristina il valore precedente senza cancellarlo e mostra dialog modale
        const updated = rows.map(r => (r.id === id ? { ...r, diameter: prevVal } : r));
        onChangeRows(updated);
        setInvalidDiaModalOpen(true);
        return;
      }
    } else if (field === 'qty') {
      if (!Number.isInteger(value) || value! < 1 || value! > 10000) {
        const updated = rows.map(r => (r.id === id ? { ...r, qty: prevVal } : r));
        onChangeRows(updated);
        onToast('Quantità non valida: inserire un intero positivo da 1 a 10.000.');
        return;
      }
    } else if (field === 'length') {
      if (!Number.isInteger(value) || value! < 1 || value! > 1200) {
        const updated = rows.map(r => (r.id === id ? { ...r, length: prevVal } : r));
        onChangeRows(updated);
        onToast('Lunghezza non valida: inserire un intero in cm da 1 a 1.200.');
        return;
      }
    }

    const normalized = String(value);
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: normalized } : r));
    onChangeRows(updated);

    checkDuplicates(id, updated);
  };

  // Controllo duplicati
  const checkDuplicates = (currentId: string, currentRows: MasterRow[]) => {
    const currentRow = currentRows.find(r => r.id === currentId);
    if (!currentRow) return;

    const curD = inputNumber(currentRow.diameter);
    const curL = inputNumber(currentRow.length);
    const curQ = inputNumber(currentRow.qty);

    if (!validDiameter(curD) || !curL || curL <= 0 || !curQ || curQ <= 0) {
      return;
    }

    const duplicateTarget = currentRows.find(
      r =>
        r.id !== currentId &&
        inputNumber(r.diameter) === curD &&
        inputNumber(r.length) === curL &&
        (inputNumber(r.qty) || 0) > 0
    );

    if (duplicateTarget) {
      setDuplicateCandidate({
        sourceRowId: currentId,
        targetRowId: duplicateTarget.id,
        addQty: curQ,
      });
    }
  };

  const handleConfirmMergeDuplicate = () => {
    if (!duplicateCandidate) return;
    const { sourceRowId, targetRowId, addQty } = duplicateCandidate;

    const updated = rows
      .map(r => {
        if (r.id === targetRowId) {
          const currentQty = inputNumber(r.qty) || 0;
          return { ...r, qty: String(currentQty + addQty) };
        }
        return r;
      })
      .filter(r => r.id !== sourceRowId);

    const finalRows = updated.length > 0 ? updated : [blankMaster()];
    onChangeRows(finalRows);
    setDuplicateCandidate(null);
    onToast(`Quantità (${addQty} pz) aggiunta alla riga esistente.`);
  };

  const handleCancelMergeDuplicate = () => {
    setDuplicateCandidate(null);
  };

  // Navigazione tastiera (Invio): da Diametro -> Nr -> Lunghezza -> Riga successiva
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: 'diameter' | 'qty' | 'length',
    rowId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();

      if (field === 'diameter') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="qty"]`
        );
        nextInput?.focus();
      } else if (field === 'qty') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="length"]`
        );
        nextInput?.focus();
      } else if (field === 'length') {
        // Se c'è una riga successiva nei dati visibili
        if (rowIndex < effectiveRows.length - 1) {
          const nextRow = effectiveRows[rowIndex + 1];
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-id="${nextRow.id}"][data-field="diameter"]`
          );
          nextInput?.focus();
        } else {
          // Ultima riga: aggiungi nuova riga e scorri
          const newRow = blankMaster();
          if (isFiltered) {
            newRow.diameter = String(selectedDiameter);
          }
          nextFocusRowIdRef.current = newRow.id;
          onChangeRows([...rows, newRow]);
        }
      }
    }
  };

  // Aggiungi riga manuale
  const handleAddRow = () => {
    const newRow = blankMaster();
    if (isFiltered) {
      newRow.diameter = String(selectedDiameter);
    }
    nextFocusRowIdRef.current = newRow.id;
    onChangeRows([...rows, newRow]);
  };

  // Eliminazione riga con Undo Toast
  const handleDeleteRow = (id: string, index: number) => {
    const targetRow = rows.find(r => r.id === id);
    if (!targetRow) return;

    const isEmptyRow =
      !targetRow.diameter.trim() && !targetRow.qty.trim() && !targetRow.length.trim();

    const updated = rows.filter(r => r.id !== id);
    const finalRows = updated.length > 0 ? updated : [blankMaster()];
    onChangeRows(finalRows);

    if (!isEmptyRow) {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      setDeletedRecord({ row: targetRow, index });
      undoTimerRef.current = window.setTimeout(() => {
        setDeletedRecord(null);
      }, 5000);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedRecord) return;
    const restored = [...rows];
    restored.splice(deletedRecord.index, 0, deletedRecord.row);
    onChangeRows(restored);
    setDeletedRecord(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    onToast('Riga ripristinata con successo.');
  };

  // 5) Svuota tabella: se filtro attivo, elimina solo i record filtrati; se Tutti, svuota tutti
  const handleConfirmClearTable = () => {
    if (selectedDiameter === 'all') {
      onChangeRows([blankMaster()]);
      setClearTableModalOpen(false);
      onToast(`${kind === 'stockDetail' ? 'Giacenza' : 'Richiesta'}: tabella svuotata.`);
    } else {
      const remaining = rows.filter(r => inputNumber(r.diameter) !== selectedDiameter);
      const updated = remaining.length > 0 ? remaining : [blankMaster()];
      onChangeRows(updated);
      setClearTableModalOpen(false);
      onToast(`Eliminati i record con diametro Ø ${selectedDiameter} mm.`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      onImportXls(file);
    }
    e.target.value = '';
  };

  const clearModalTitle =
    selectedDiameter === 'all'
      ? 'Svuota tabella'
      : `Elimina elementi Ø ${selectedDiameter} mm`;

  const clearModalMessage =
    selectedDiameter === 'all'
      ? 'Gli elementi della tabella stanno per essere eliminati definitivamente. Continuare?'
      : `Gli elementi della tabella con diametro Ø ${selectedDiameter} mm stanno per essere eliminati definitivamente. Continuare?`;

  return (
    <section className="page active" id={`page-${kind}`}>
      {/* 1) Testata: Titolo e sottotitolo a sinistra, 2 icone XLS (Importa ed Esporta) a destra */}
      <div className="section-head section-head-with-xls-icons">
        <div className="section-head-text">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* 2 icone XLS a destra all'altezza del titolo e del sottotitolo */}
        <div className="section-head-actions-xls">
          <button
            className="xls-action-icon-btn"
            type="button"
            onClick={handleImportClick}
            title="Importa da Excel (.xlsx)"
            aria-label="Importa da Excel"
          >
            <ExcelImportIcon size={34} />
          </button>
          <button
            className="xls-action-icon-btn"
            type="button"
            onClick={onExportXls}
            title="Esporta in Excel (.xlsx)"
            aria-label="Esporta in Excel"
          >
            <ExcelExportIcon size={34} />
          </button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* Etichetta in grassetto sopra il filtro dei diametri */}
      <div className="filter-section-header">
        <strong>Filtra Diametri</strong>
      </div>

      {/* Filtro rapido Diametri */}
      <DiameterFilter
        rows={rows}
        selectedDiameter={selectedDiameter}
        onSelectDiameter={setSelectedDiameter}
      />

      {/* Widget Totali dinamici affiancati orizzontalmente (mai uno sopra l'altro) */}
      <div className="calc-total totals-side-by-side">
        <div className="summary-box">
          <div className="s-label">
            {isFiltered
              ? `SVILUPPO BARRE Ø ${selectedDiameter}`
              : 'SVILUPPO COMPLESSIVO'}
          </div>
          <div className="s-value">
            {fmt(statsMeters)}
            <span className="s-unit">m</span>
          </div>
          <div className="s-sub">
            {isFiltered ? `${statsPieces} pezzi` : `${statsPieces} pezzi totali`}
          </div>
        </div>

        <div className="summary-box">
          <div className="s-label">PESO TOTALE</div>
          <div className="s-value">
            {fmt(statsWeight)}
            <span className="s-unit">kg</span>
          </div>
          <div className="s-sub">Acciaio B450C</div>
        </div>
      </div>

      {/* Pannello Principale Tabella */}
      <div className="panel master-table-panel">
        {/* 2) Intestazione stabile: Titolo a sinistra e Tasto Ordina tipo Tasto Ordina.png tutto a destra */}
        <div className="panel-head master-head-with-sort-right">
          <div className="master-head-title-row">
            <h3>{kind === 'stockDetail' ? 'Elenco Giacenza' : 'Elenco Richiesta'}</h3>
            {isFiltered && (
              <span className="active-filter-badge">
                Ø {selectedDiameter} mm ({effectiveRows.length})
              </span>
            )}
          </div>

          {/* Pulsante Ordina tutto a destra con icona fedele a Tasto Ordina.png */}
          <button
            className="btn-sort-icon-trigger"
            type="button"
            onClick={onOpenSort}
            title={`Ordina ${kind === 'stockDetail' ? 'Giacenza' : 'Richiesta'}`}
            aria-label="Ordina tabella"
          >
            <SortTriggerIcon />
          </button>
        </div>

        <div className="panel-body">
          <div className="table-wrap">
            <table className="master-table">
              <colgroup>
                <col className="dia" />
                <col className="qty" />
                <col className="length" />
                <col className="weight" />
                <col className="action" />
              </colgroup>
              <thead>
                <tr>
                  <th>Ø [mm]</th>
                  <th>Nr.</th>
                  <th>L [cm]</th>
                  <th>P [kg]</th>
                  <th>
                    {/* Pulsante X per svuotare con modale in-app */}
                    <button
                      className="header-clear"
                      type="button"
                      onClick={() => setClearTableModalOpen(true)}
                      aria-label="Svuota tabella"
                      title={
                        isFiltered
                          ? `Elimina elementi Ø ${selectedDiameter} mm`
                          : 'Svuota tabella'
                      }
                    >
                      ×
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {effectiveRows.map((r, i) => {
                  const q = inputNumber(r.qty);
                  const l = inputNumber(r.length);
                  const d = inputNumber(r.diameter);
                  const rowWeight =
                    Number.isInteger(q) &&
                    q! > 0 &&
                    q! <= 10000 &&
                    Number.isInteger(l) &&
                    l! > 0 &&
                    l! <= 1200 &&
                    validDiameter(d)
                      ? ((q! * l!) / 100) * unitWeight(d!)
                      : 0;

                  return (
                    <tr key={r.id}>
                      <td>
                        {/* 3) Selezione testo al clic senza menu contestuale tramite contextmenu preventDefault */}
                        <input
                          className="cell-input"
                          type="number"
                          min="6"
                          max="40"
                          step="2"
                          inputMode="numeric"
                          data-row-id={r.id}
                          data-field="diameter"
                          aria-label={`Diametro riga ${i + 1}`}
                          value={r.diameter}
                          placeholder="Ø"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          onContextMenu={e => e.preventDefault()}
                          onFocus={e => handleCellFocus(e, r.id, 'diameter', e.target.value)}
                          onChange={e => handleCellChange(r.id, 'diameter', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'diameter', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'diameter', r.id)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          inputMode="numeric"
                          data-row-id={r.id}
                          data-field="qty"
                          aria-label={`Numero riga ${i + 1}`}
                          value={r.qty}
                          placeholder="Nr."
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          onContextMenu={e => e.preventDefault()}
                          onFocus={e => handleCellFocus(e, r.id, 'qty', e.target.value)}
                          onChange={e => handleCellChange(r.id, 'qty', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'qty', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'qty', r.id)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="1"
                          max="1200"
                          step="1"
                          inputMode="numeric"
                          data-row-id={r.id}
                          data-field="length"
                          aria-label={`Lunghezza in centimetri riga ${i + 1}`}
                          value={r.length}
                          placeholder="cm"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          onContextMenu={e => e.preventDefault()}
                          onFocus={e => handleCellFocus(e, r.id, 'length', e.target.value)}
                          onChange={e => handleCellChange(r.id, 'length', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'length', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'length', r.id)}
                        />
                      </td>
                      <td className="weight-cell">
                        <span>{rowWeight > 0 ? fmt(rowWeight) : '—'}</span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => handleDeleteRow(r.id, i)}
                          aria-label={`Elimina riga ${i + 1}`}
                          title="Elimina riga"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-bottom-actions">
            <button
              className="btn primary small"
              type="button"
              onClick={handleAddRow}
            >
              ＋ Aggiungi Riga
            </button>
          </div>
        </div>
      </div>

      {/* Toast Annulla (Undo) su singola riga ampia */}
      {deletedRecord && (
        <div className="undo-delete-toast-v3" role="alert">
          <span className="undo-toast-text-v3">
            Rimosso: <strong>Ø {deletedRecord.row.diameter || '?'}</strong> · L:{' '}
            <strong>{deletedRecord.row.length || '?'} cm</strong> ({deletedRecord.row.qty || '?'} pz)
          </span>
          <button
            type="button"
            className="undo-btn-v3"
            onClick={handleUndoDelete}
            title="Annulla eliminazione"
          >
            <span className="undo-icon">↶</span> Annulla
          </button>
        </div>
      )}

      {/* Modale Diametro Non Valido */}
      <ConfirmModal
        isOpen={invalidDiaModalOpen}
        title="Diametro non valido"
        message="Sono ammessi solo numeri pari da 6 a 40."
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setInvalidDiaModalOpen(false)}
      />

      {/* 5) Modale Svuota Tabella: se filtro attivo elimina solo quel diametro, altrimenti tutti */}
      <ConfirmModal
        isOpen={clearTableModalOpen}
        title={clearModalTitle}
        message={clearModalMessage}
        confirmText="Elimina tutti"
        cancelText="Annulla"
        confirmStyle="danger"
        onConfirm={handleConfirmClearTable}
        onCancel={() => setClearTableModalOpen(false)}
      />

      {/* Modale Duplicato */}
      <ConfirmModal
        isOpen={duplicateCandidate !== null}
        title="Elemento già presente in tabella"
        message="Elemento già presente in tabella: aggiungere alla quantità esistente?"
        isDuplicatePrompt={true}
        onConfirm={handleConfirmMergeDuplicate}
        onCancel={handleCancelMergeDuplicate}
      />
    </section>
  );
};
