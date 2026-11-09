import * as XLSX from 'xlsx';
import { MasterRow, OptimizationResult } from '../types';
import {
  inputNumber,
  newId,
  round2,
  snapFloatingNoiseToInteger,
  validDiameter,
  validMasterRows,
  resultKey,
  fmt,
  unitWeight,
} from './math';
import { buildOperationalPlan } from './optimizer';
import { download, saveWithPicker } from './storage';

export function parseExcelNumber(value: unknown, field = 'number'): number | null {
  const normalizeIntegerNoise = (num: number | null) =>
    num !== null && Number.isFinite(num) ? snapFloatingNoiseToInteger(num) : null;

  if (typeof value === 'number') return normalizeIntegerNoise(value);
  if (value === null || value === undefined) return null;
  let text = String(value).trim().replace(/[\s\u00a0\u202f\u2009]/g, '');
  if (!text) return null;
  if (!/^[-+]?\d[\d.,]*$/.test(text)) return null;

  const isValidCandidate = (num: number | null): boolean => {
    num = normalizeIntegerNoise(num);
    if (num === null || !Number.isFinite(num)) return false;
    if (field === 'diameter') return validDiameter(num);
    if (field === 'qty') return Number.isInteger(num) && num >= 1 && num <= 10000;
    if (field === 'length') return Number.isInteger(num) && num >= 1 && num <= 1200;
    return true;
  };

  const commaCount = (text.match(/,/g) || []).length;
  const dotCount = (text.match(/\./g) || []).length;

  if (commaCount + dotCount === 1) {
    const sep = commaCount === 1 ? ',' : '.';
    const pattern = sep === ',' ? /^[-+]?\d{1,3},\d{3}$/ : /^[-+]?\d{1,3}\.\d{3}$/;
    if (pattern.test(text)) {
      const decimal = normalizeIntegerNoise(Number(text.replace(sep, '.')));
      const grouped = normalizeIntegerNoise(Number(text.replace(sep, '')));
      const decimalOK = isValidCandidate(decimal);
      const groupedOK = isValidCandidate(grouped);
      if (decimalOK && !groupedOK) return decimal;
      if (groupedOK && !decimalOK) return grouped;
      if (decimalOK && groupedOK) return sep === ',' ? decimal : grouped;
    }
  }

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) text = text.replace(/\./g, '').replace(/,/g, '.');
    else text = text.replace(/,/g, '');
  } else if (comma >= 0) {
    if (/^[-+]?\d{1,3}(,\d{3})+$/.test(text) && !/,0+$/.test(text)) text = text.replace(/,/g, '');
    else text = text.replace(/,/g, '.');
  } else if (dot >= 0) {
    if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  }
  return normalizeIntegerNoise(Number(text));
}

export function excelHeaderMap(header: any[]): { diameter: number; qty: number; length: number } {
  const normalize = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ø/g, ' diametro ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const names = header.map(normalize);
  const diameter = names.findIndex(
    (h, i) => h.includes('diam') || String(header[i] ?? '').includes('Ø') || String(header[i] ?? '').includes('ø')
  );
  const qty = names.findIndex(h => /\b(nr|n|numero|barre|pezzi|quantita|qty|qta)\b/.test(h));
  const length = names.findIndex(h => h.includes('lunghezza') || h.includes('length') || h.includes('cm') || h === 'l');
  return { diameter, qty, length };
}

export async function parseMasterXls(file: File): Promise<MasterRow[]> {
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false });
  if (!workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error('Il file Excel non contiene fogli di lavoro.');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('Il primo foglio del file Excel non è leggibile.');

  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: true, blankrows: true });
  if (!rows.length) throw new Error('Il foglio Excel è vuoto.');

  const isEmptyRow = (row: any) => !Array.isArray(row) || !row.some(value => String(value ?? '').trim());
  const baseRow = sheet['!ref'] && XLSX.utils.decode_range ? XLSX.utils.decode_range(sheet['!ref']).s.r : 0;
  const firstNonEmpty = rows.findIndex(row => !isEmptyRow(row));
  if (firstNonEmpty < 0) throw new Error('Il foglio Excel è vuoto.');

  let headerIndex = -1;
  let map: { diameter: number; qty: number; length: number } | null = null;
  const headerSearchLimit = Math.min(rows.length, firstNonEmpty + 20);
  for (let i = firstNonEmpty; i < headerSearchLimit; i++) {
    if (isEmptyRow(rows[i])) continue;
    const candidate = excelHeaderMap(rows[i]);
    if (candidate.diameter >= 0 && candidate.qty >= 0 && candidate.length >= 0) {
      headerIndex = i;
      map = candidate;
      break;
    }
  }

  let start: number;
  if (headerIndex >= 0 && map) {
    start = headerIndex + 1;
  } else {
    const firstMap = excelHeaderMap(rows[firstNonEmpty]);
    if (firstMap.diameter >= 0 || firstMap.qty >= 0 || firstMap.length >= 0) {
      throw new Error('Intestazioni Excel non riconosciute. Sono richieste le colonne Diametro [mm], Nr. e L [cm].');
    }
    map = { diameter: 0, qty: 1, length: 2 };
    start = firstNonEmpty;
  }

  const activeMap = map;
  const output: MasterRow[] = [];
  const groupedIndexByKey = new Map<string, number>();

  for (let i = start; i < rows.length; i++) {
    const cells = rows[i];
    if ([cells[activeMap.diameter], cells[activeMap.qty], cells[activeMap.length]].every(value => String(value ?? '').trim() === '')) {
      continue;
    }
    const d = parseExcelNumber(cells[activeMap.diameter], 'diameter');
    const q = parseExcelNumber(cells[activeMap.qty], 'qty');
    const l = parseExcelNumber(cells[activeMap.length], 'length');

    if (!validDiameter(d) || !Number.isInteger(q) || q! < 1 || q! > 10000 || !Number.isInteger(l) || l! < 1 || l! > 1200) {
      const excelRow = baseRow + i + 1;
      throw new Error(
        `E' stato riscontrato un errore nella riga ${excelRow}: il [Diametro] deve essere un numero pari compreso tra 6 e 40, la [Quantità] un numero intero da 1 a 10.000 e la [Lunghezza] un numero intero da 1 a 1.200. Non sono ammessi valori vuoti né uguali a zero.`
      );
    }

    // Raggruppa i records con lo stesso diametro e la stessa lunghezza sommando le relative quantità
    const key = `${d}_${l}`;
    const existingIndex = groupedIndexByKey.get(key);
    if (existingIndex !== undefined) {
      const existing = output[existingIndex];
      const newQty = (inputNumber(existing.qty) || 0) + q!;
      existing.qty = String(newQty);
    } else {
      groupedIndexByKey.set(key, output.length);
      output.push({ id: newId(), diameter: String(d), qty: String(q), length: String(l) });
    }
  }

  if (!output.length) throw new Error('Il foglio Excel non contiene record validi da importare.');
  return output;
}

export async function exportMasterXls(
  rowsData: MasterRow[],
  labelName: 'giacenza' | 'richiesta',
  onToast: (msg: string) => void
) {
  try {
    const rows: (string | number)[][] = [['Diametro [mm]', 'Nr.', 'L [cm]']];
    for (const r of validMasterRows(rowsData)) {
      const d = inputNumber(r.diameter)!;
      const q = inputNumber(r.qty)!;
      const l = inputNumber(r.length)!;
      rows.push([d, q, l]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 14 }];
    for (let row = 2; row <= rows.length; row++) {
      for (const col of ['A', 'B', 'C']) {
        const cell = worksheet[`${col}${row}`];
        if (cell) cell.z = '0';
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, labelName === 'giacenza' ? 'Giacenza' : 'Richiesta');
    const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    try {
      const result = await saveWithPicker({
        name: `${labelName}.xlsx`,
        content,
        type: mime,
        description: `Esportazione Excel ${labelName}`,
        extension: '.xlsx',
      });
      if (result.cancelled) return;
      if (result.supported) {
        onToast(`${labelName[0].toUpperCase() + labelName.slice(1)} esportata in Excel (.xlsx).`);
        return;
      }
    } catch (e: any) {
      if (e && e.name === 'AbortError') return;
      alert('Non è stato possibile aprire la finestra di salvataggio. Il file Excel verrà scaricato con il metodo standard.');
    }

    download(`${labelName}.xlsx`, content, mime);
    onToast('Questo browser non consente di scegliere il percorso dalla pagina: file Excel scaricato nella cartella predefinita.');
  } catch (e: any) {
    alert(`Impossibile esportare il file Excel: ${e.message || 'errore nella creazione del file.'}`);
  }
}

export async function exportPlanXls(
  result: OptimizationResult | null,
  onToast: (msg: string) => void
) {
  if (!result) {
    alert('Non è disponibile alcun piano da esportare.');
    return;
  }
  try {
    const { cuts, rows: operations } = buildOperationalPlan(result);
    const headers = [
      'ID\n[n]',
      'Ø\n[mm]',
      'N. barre\n[n]',
      'Barra\n[m]',
      'Recupero\n[m]',
      'Scarto\n[m]',
      ...cuts.map(d => `Taglio Ø ${d.diameter}\n${fmt(d.length / 100)} m`),
      'Peso\n[kg]',
    ];
    const rows: (string | number)[][] = [headers];

    for (const p of operations) {
      const allocatedWeight = (p.barUnits / 100) * unitWeight(p.diameter) * p.barCount;
      rows.push(
        [
          Number(p.barId),
          p.diameter,
          p.barCount,
          round2(p.barUnits / 100),
          round2(p.recoveryUnits / 100),
          round2(p.scrapUnits / 100),
          ...cuts.map(d => (p.cutKey === resultKey(d.diameter, d.length) ? p.cutCount : 0)),
          round2(allocatedWeight),
        ].map(value => (typeof value === 'number' ? round2(value) : value))
      );
    }

    if (rows.length === 1) {
      throw new Error('Il Piano di taglio non contiene operazioni da esportare.');
    }

    // Esporta unicamente i records senza riga dei totali (richiesta v. 1.38/1.39)
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Larghezza uniforme per tutte le colonne con formattazione testo a capo
    worksheet['!cols'] = headers.map(() => ({ wch: 13 }));
    worksheet['!rows'] = [
      { hpt: 32 },
      ...operations.map(() => ({ hpt: 20 })),
    ];

    // Formattazione celle (testo a capo per intestazioni e formati numerici)
    for (let c = 0; c < headers.length; c++) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
      if (headerCell) {
        (headerCell as any).s = {
          alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
          font: { bold: true },
        };
      }
    }

    const dataRowCount = operations.length;
    for (let r = 1; r <= dataRowCount; r++) {
      // ID (col 0), Ø (col 1), N. barre (col 2)
      for (const c of [0, 1, 2]) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.z = '0';
      }
      // Barra (col 3), Recupero (col 4), Scarto (col 5)
      for (const c of [3, 4, 5]) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.z = '0.00';
      }
      // Tagli (col 6 .. 6 + cuts.length - 1)
      for (let i = 0; i < cuts.length; i++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c: 6 + i })];
        if (cell) cell.z = '0';
      }
      // Peso (col 6 + cuts.length)
      const pesoCell = worksheet[XLSX.utils.encode_cell({ r, c: 6 + cuts.length })];
      if (pesoCell) pesoCell.z = '0.00';
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Piano di taglio');
    const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    try {
      const saveRes = await saveWithPicker({
        name: 'piano-taglio-v1.40.xlsx',
        content,
        type: mime,
        description: 'Piano di taglio Excel',
        extension: '.xlsx',
      });
      if (saveRes.cancelled) return;
      if (saveRes.supported) {
        onToast('Piano di taglio esportato in Excel (.xlsx).');
        return;
      }
    } catch (e: any) {
      if (e && e.name === 'AbortError') return;
      alert('La finestra di salvataggio non è riuscita; il file Excel verrà scaricato con il metodo standard.');
    }

    download('piano-taglio-v1.40.xlsx', content, mime);
    onToast('Piano di taglio Excel scaricato.');
  } catch (e: any) {
    alert(`Impossibile esportare il Piano di taglio: ${e.message || 'errore nella creazione del file Excel.'}`);
  }
}
