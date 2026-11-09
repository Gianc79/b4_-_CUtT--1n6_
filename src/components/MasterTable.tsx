import React, { useState, useRef, useEffect } from 'react';
import { MasterRow } from '../types';
import {
  blankMaster,
  fmt,
  intFmt,
  inputNumber,
  newId,
  unitWeight,
  validDiameter,
} from '../utils/math';
import { DiameterFilter } from './DiameterFilter';
import { ConfirmModal } from './ConfirmModal';
import { ExcelImportIcon, ExcelExportIcon, SortTableIcon } from './ExcelIcons';

interface MasterTableProps {
  kind: 'stockDetail' | 'demandDetail';
  title: string;
  subtitle: React.ReactNode;
  rows: MasterRow[];
  onChangeRows: (rows: MasterRow[]) => void;
  onOpenSort: () => void;
  onImportXls: (file: File) => void;
  onExportXls: () => void;
  onToast: (msg: string) => void;
  selectedDiameter?: number | 'all';
  onSelectDiameter?: (dia: number | 'all') => void;
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
  selectedDiameter: propSelectedDiameter,
  onSelectDiameter: propOnSelectDiameter,
}) => {
  const [internalSelectedDiameter, setInternalSelectedDiameter] = useState<number | 'all'>('all');
  const selectedDiameter = propSelectedDiameter !== undefined ? propSelectedDiameter : internalSelectedDiameter;
  const setSelectedDiameter = (dia: number | 'all') => {
    if (propOnSelectDiameter) {
      propOnSelectDiameter(dia);
    } else {
      setInternalSelectedDiameter(dia);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus management per immissione con Invio e scorrimento controllato
  const nextFocusTargetRef = useRef<{ rowId: string; field: 'diameter' | 'qty' } | null>(null);
  // Timestamp per prevenire salti multipli e cascate di celle su tastiere virtuali smartphone
  const lastEnterTimestampRef = useRef<number>(0);

  // Memorizzazione valore precedente per ripristino in caso di diametro errato
  const cellPreviousValuesRef = useRef<Record<string, string>>({});

  // Modali in-app
  const [invalidDiaModalOpen, setInvalidDiaModalOpen] = useState(false);
  const [clearTableModalOpen, setClearTableModalOpen] = useState(false);
  const [emptyTableModalOpen, setEmptyTableModalOpen] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);

  // Undo eliminazione riga
  const [deletedRecord, setDeletedRecord] = useState<DeletedRowRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Assistente allo scorrimento stabile: interviene SOLO se la cella è realmente fuori dall'area visibile
  const scrollElementIntoWorkArea = (el: HTMLElement) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Margine superiore per TopBar (65px) e margine inferiore per tastiera smartphone (35% vh)
    const topSafe = 65;
    const bottomSafe = vh * 0.38;

    // Se la cella è già comodamente visibile nell'area utile, NON effettuare alcuno scroll
    if (rect.top >= topSafe && rect.bottom <= (vh - bottomSafe)) {
      return;
    }

    // Altrimenti avvicinala con scorrimento dolce e stabile al bordo più vicino senza oscillazioni
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  // Spostamento tabella all'aggiunta di una nuova riga (con focus alla cella successiva 'qty' se filtro diametro attivo)
  useEffect(() => {
    if (nextFocusTargetRef.current) {
      const { rowId, field } = nextFocusTargetRef.current;
      const targetInput = document.querySelector<HTMLInputElement>(
        `input[data-row-id="${rowId}"][data-field="${field}"]`
      );
      if (targetInput) {
        try {
          targetInput.focus({ preventScroll: true });
        } catch (_) {
          targetInput.focus();
        }
        try {
          targetInput.select();
        } catch (_) {}
        setTimeout(() => {
          scrollElementIntoWorkArea(targetInput);
        }, 30);
      }
      nextFocusTargetRef.current = null;
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

  // Seleziona tutto il contenuto al clic/focus senza forzare scorrimenti bruschi
  const handleCellFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    id: string,
    field: 'diameter' | 'qty' | 'length',
    currentVal: string
  ) => {
    document.body.classList.add('keyboard-input-open');
    cellPreviousValuesRef.current[`${id}_${field}`] = currentVal;
    try {
      e.target.select();
    } catch (_) {}
  };

  const handleCellBlur = (id: string, field: 'diameter' | 'qty' | 'length', rawVal: string) => {
    setTimeout(() => {
      if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
        document.body.classList.remove('keyboard-input-open');
      }
    }, 150);

    const trimmed = rawVal.trim();
    const prevVal = cellPreviousValuesRef.current[`${id}_${field}`] || '';

    if (trimmed === '') return;

    const value = inputNumber(trimmed);

    if (field === 'diameter') {
      if (!validDiameter(value)) {
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

  // 6) Navigazione tastiera (Invio): stabile, con debounce contro cascata ed evitando scorrimenti tra celle della stessa riga
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: 'diameter' | 'qty' | 'length',
    rowId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Debounce contro invii multipli/a raffica tipici delle tastiere software smartphone
      const now = Date.now();
      if (now - lastEnterTimestampRef.current < 200) {
        return;
      }
      lastEnterTimestampRef.current = now;

      if (field === 'diameter') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="qty"]`
        );
        if (nextInput) {
          setTimeout(() => {
            try {
              nextInput.focus({ preventScroll: true });
            } catch (_) {
              nextInput.focus();
            }
            try {
              nextInput.select();
            } catch (_) {}
          }, 30);
        }
      } else if (field === 'qty') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="length"]`
        );
        if (nextInput) {
          setTimeout(() => {
            try {
              nextInput.focus({ preventScroll: true });
            } catch (_) {
              nextInput.focus();
            }
            try {
              nextInput.select();
            } catch (_) {}
          }, 30);
        }
      } else if (field === 'length') {
        // Riga successiva: controlla visibilità ed evita oscillazioni
        if (rowIndex < effectiveRows.length - 1) {
          const nextRow = effectiveRows[rowIndex + 1];
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-id="${nextRow.id}"][data-field="diameter"]`
          );
          if (nextInput) {
            setTimeout(() => {
              try {
                nextInput.focus({ preventScroll: true });
              } catch (_) {
                nextInput.focus();
              }
              try {
                nextInput.select();
              } catch (_) {}
              scrollElementIntoWorkArea(nextInput);
            }, 30);
          }
        } else {
          // Ultima riga: aggiungi nuova riga e passa il focus alla cella successiva (qty) se c'è un filtro attivo
          const newRow = blankMaster();
          if (isFiltered) {
            newRow.diameter = String(selectedDiameter);
          }
          nextFocusTargetRef.current = {
            rowId: newRow.id,
            field: isFiltered ? 'qty' : 'diameter',
          };
          onChangeRows([...rows, newRow]);
        }
      }
    }
  };

  // Aggiungi riga manuale: precompila Ø con il filtro attivo e porta il cursore alla cella successiva (qty)
  const handleAddRow = () => {
    const newRow = blankMaster();
    if (isFiltered) {
      newRow.diameter = String(selectedDiameter);
    }
    nextFocusTargetRef.current = {
      rowId: newRow.id,
      field: isFiltered ? 'qty' : 'diameter',
    };
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

  // Svuota tabella con filtro attivo o generale
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

  const handleHeaderClearClick = () => {
    const isTableEmpty =
      effectiveRows.length === 0 ||
      effectiveRows.every(
        r => !r.diameter.trim() && !r.qty.trim() && !r.length.trim()
      );

    if (isTableEmpty) {
      setEmptyTableModalOpen(true);
      return;
    }
    setClearTableModalOpen(true);
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
      {/* 1) Testata: Titolo e sottotitolo a sinistra, 2 icone XLS ufficiali a destra */}
      <div className="section-head section-head-with-xls-icons">
        <div className="section-head-text">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* 2 icone XLS ufficiali all'altezza del titolo e del sottotitolo */}
        <div className="section-head-actions-xls">
          <button
            className="xls-action-icon-btn"
            type="button"
            onClick={handleImportClick}
            title="Importa da Excel (.xlsx)"
            aria-label="Importa da Excel"
          >
            <ExcelImportIcon size={38} />
          </button>
          <button
            className="xls-action-icon-btn"
            type="button"
            onClick={onExportXls}
            title="Esporta in Excel (.xlsx)"
            aria-label="Esporta in Excel"
          >
            <ExcelExportIcon size={38} />
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

      {/* 3) Widgets SVILUPPO COMPLESSIVO e PESO TOTALE con formattazione 3D piacevole e separatore migliaia */}
      <div className="kpis-modern-3d master-kpis-3d">
        <div className="kpi-card-3d">
          <div className="kpi-label-3d">
            {isFiltered
              ? `Sviluppo Barre Ø ${selectedDiameter}`
              : 'Sviluppo Complessivo'}
          </div>
          <div className="kpi-value-3d">
            {fmt(statsMeters)} <span className="kpi-unit-inline">m</span>
          </div>
          <div className="kpi-sub-3d">
            {isFiltered ? `${intFmt(statsPieces)} pezzi` : `${intFmt(statsPieces)} pezzi totali`}
          </div>
        </div>

        <div className="kpi-card-3d accent-green-3d">
          <div className="kpi-label-3d">
            {isFiltered
              ? `Peso Barre Ø ${selectedDiameter}`
              : 'Peso Totale'}
          </div>
          <div className="kpi-value-3d">
            {fmt(statsWeight)} <span className="kpi-unit-inline">kg</span>
          </div>
          <div className="kpi-sub-3d">Acciaio B450C</div>
        </div>
      </div>

      {/* Pannello Principale Tabella */}
      <div className="panel master-table-panel">
        {/* 4) Intestazione: Titolo a sinistra e Tasto Ordina ufficiale allegato tutto a destra */}
        <div className="panel-head master-head-with-sort-right">
          <div className="master-head-title-row">
            <h3>{kind === 'stockDetail' ? 'Elenco Giacenza' : 'Elenco Richiesta'}</h3>
            {isFiltered && (
              <span className="active-filter-badge">
                Ø {selectedDiameter} mm ({effectiveRows.length})
              </span>
            )}
          </div>

          {/* 4) Pulsante Ordina con l'icona ufficiale fornita (Ordina.jpg) */}
          <button
            className="btn-sort-icon-trigger"
            type="button"
            onClick={onOpenSort}
            title={`Ordina ${kind === 'stockDetail' ? 'Giacenza' : 'Richiesta'}`}
            aria-label="Ordina tabella"
          >
            <SortTableIcon size={38} />
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
                    <button
                      className="header-clear"
                      type="button"
                      onClick={handleHeaderClearClick}
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

          {/* Spaziatore inferiore per consentire lo scorrimento completo sopra la tastiera dello smartphone */}
          <div className="table-keyboard-bottom-spacer" aria-hidden="true" />
        </div>
      </div>

      {/* 2) Toast Annulla (Undo) in stile SpesaSuMisura con riquadro marcato e ombra */}
      {deletedRecord && (
        <div className="undo-delete-toast-spesa" role="alert">
          <span className="undo-toast-text-spesa">
            Rimosso: <strong>Ø {deletedRecord.row.diameter || '?'}</strong> · L:{' '}
            <strong>{deletedRecord.row.length || '?'} cm</strong> ({intFmt(Number(deletedRecord.row.qty) || 0)} pz)
          </span>
          <button
            type="button"
            className="undo-btn-spesa"
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

      {/* Modale Tabella Già Vuota */}
      <ConfirmModal
        isOpen={emptyTableModalOpen}
        title="Tabella vuota"
        message="La tabella è già vuota."
        confirmText="OK"
        showCancel={false}
        showCloseButton={false}
        onConfirm={() => setEmptyTableModalOpen(false)}
      />

      {/* Modale Svuota Tabella */}
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
