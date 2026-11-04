import { AppState, MasterRow } from '../types';
import { blankMaster, newId, normalizeFieldValue, valNumber } from './math';
import { normalizeResultRows } from './optimizer';

export const STORE_KEY = 'barreCA.app.v1';
export const SCHEMA_VERSION = 4;

function oldLengthInMeters(row: Record<string, unknown>): number {
  const segs = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6']
    .map(k => valNumber(row[k]))
    .filter((v): v is number => v !== null && v > 0);
  return segs.length ? segs.reduce((a, b) => a + b, 0) : Math.max(0, valNumber(row.synth) || 0);
}

function migrateOldState(d: Record<string, unknown>): AppState {
  const fallback = String(d.diameter ?? '');
  const convertQuick = (rows: unknown): MasterRow[] =>
    Array.isArray(rows) && rows.length
      ? rows.map(r => ({
          id: r.id || newId(),
          diameter: String(r.diameter ?? fallback),
          qty: String(r.qty ?? ''),
          length:
            r.length === '' || r.length === null || r.length === undefined
              ? ''
              : String(Math.round((valNumber(r.length) || 0) * 100)),
        }))
      : [blankMaster()];

  const convertMaster = (rows: unknown): MasterRow[] =>
    Array.isArray(rows) && rows.length
      ? rows
          .map(r => ({
            id: r.id || newId(),
            diameter: String(r.diameter ?? ''),
            qty: String(r.qty ?? ''),
            length: String(Math.round(oldLengthInMeters(r) * 100)),
          }))
          .map(r => ({ ...r, length: r.length === '0' ? '' : r.length }))
      : [blankMaster()];

  const stock = Array.isArray(d.stockDetail) && d.stockDetail.length ? convertMaster(d.stockDetail) : convertQuick(d.quickStock);
  const demand = Array.isArray(d.demandDetail) && d.demandDetail.length ? convertMaster(d.demandDetail) : convertQuick(d.quickDemand);
  return { schemaVersion: SCHEMA_VERSION, stockDetail: stock, demandDetail: demand, result: null };
}

function migrateV2State(d: Record<string, unknown>): AppState {
  const masterRows = (rows: unknown): MasterRow[] =>
    Array.isArray(rows) && rows.length
      ? rows.map(r => ({
          id: r.id || newId(),
          diameter: String(r.diameter ?? ''),
          qty: String(r.qty ?? ''),
          length: String(r.length ?? ''),
        }))
      : [blankMaster()];
  const dia = Number((d.result as Record<string, unknown>)?.diameter) || Number(d.diameter);
  return {
    schemaVersion: SCHEMA_VERSION,
    stockDetail: masterRows(d.stockDetail),
    demandDetail: masterRows(d.demandDetail),
    result: normalizeResultRows(d.result as any, dia),
  };
}

export function normalizeNewState(d: any): AppState {
  const rows = (value: unknown, fn: (r: any) => MasterRow): MasterRow[] =>
    Array.isArray(value) && value.length ? value.map(fn) : [fn({})];
  const master = (r: any): MasterRow => ({
    id: r.id || newId(),
    diameter: normalizeFieldValue(r.diameter),
    qty: normalizeFieldValue(r.qty),
    length: normalizeFieldValue(r.length),
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    stockDetail: rows(d.stockDetail, master),
    demandDetail: rows(d.demandDetail, master),
    result: normalizeResultRows(d.result as any, null),
  };
}

export function defaults(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    stockDetail: [blankMaster()],
    demandDetail: [blankMaster()],
    result: null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults();
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return defaults();
    if (d.schemaVersion === SCHEMA_VERSION || d.schemaVersion === 3) return normalizeNewState(d);
    if (d.schemaVersion === 2) return migrateV2State(d);
    return migrateOldState(d);
  } catch (e) {
    return defaults();
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export function download(name: string, content: BlobPart, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function appFileContent(state: AppState): string {
  const clean = normalizeNewState({ ...state, schemaVersion: SCHEMA_VERSION });
  return JSON.stringify(
    { ...clean, exportedAt: new Date().toISOString(), formatVersion: SCHEMA_VERSION },
    null,
    2
  );
}

let currentFileHandle: any = null;

function openHandleDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      resolve(null);
      return;
    }
    const req = indexedDB.open('barreCA-filehandles-v104', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('handles')) {
        req.result.createObjectStore('handles');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function rememberFileHandle(handle: any) {
  currentFileHandle = handle;
  try {
    const db = await openHandleDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'currentAppFile');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {}
}

export async function clearRememberedFileHandle() {
  currentFileHandle = null;
  try {
    const db = await openHandleDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').delete('currentAppFile');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {}
}

export async function getRememberedFileHandle(): Promise<any> {
  if (currentFileHandle) return currentFileHandle;
  try {
    const db = await openHandleDb();
    if (!db) return null;
    const h = await new Promise((resolve, reject) => {
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('currentAppFile');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    currentFileHandle = h;
    return h;
  } catch (e) {
    return null;
  }
}

export async function writeHandle(handle: any, content: BlobPart, type: string) {
  const writable = await handle.createWritable();
  await writable.write(new Blob([content], { type }));
  await writable.close();
}

export async function saveWithPicker({
  name,
  content,
  type,
  description,
  extension,
  startInDownloads = true,
}: {
  name: string;
  content: BlobPart;
  type: string;
  description: string;
  extension: string;
  startInDownloads?: boolean;
}): Promise<{ supported: boolean; cancelled?: boolean; handle?: any }> {
  if (typeof (window as any).showSaveFilePicker !== 'function') return { supported: false };
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: name,
      ...(startInDownloads ? { startIn: 'downloads' } : {}),
      types: [
        {
          description,
          accept: { [type.split(';')[0]]: [extension] },
        },
      ],
    });
    await writeHandle(handle, content, type);
    return { supported: true, handle };
  } catch (e: any) {
    if (e && e.name === 'AbortError') return { supported: true, cancelled: true };
    throw e;
  }
}

export async function saveAsAppFile(state: AppState, onToast: (msg: string) => void) {
  const content = appFileContent(state);
  try {
    const result = await saveWithPicker({
      name: 'ottimizzazione-barre-ca-v1.25.json',
      content,
      type: 'application/json;charset=utf-8',
      description: 'Dati OTTIMIZZAZIONE BARRE C.A.',
      extension: '.json',
    });
    if (result.cancelled) return;
    if (result.supported) {
      await rememberFileHandle(result.handle);
      onToast('Salvataggio eseguito con successo.');
      return;
    }
  } catch (e: any) {
    alert('Il salvataggio tramite finestra non è riuscito. Provo a scaricare il file: ' + e.message);
  }
  download('ottimizzazione-barre-ca-v1.25.json', content, 'application/json;charset=utf-8');
  onToast('File scaricato nella cartella Download predefinita del browser.');
}

export async function saveCurrentFile(state: AppState, onToast: (msg: string) => void) {
  const content = appFileContent(state);
  const handle = await getRememberedFileHandle();
  if (handle && typeof handle.createWritable === 'function') {
    try {
      let permission = 'granted';
      if (typeof handle.queryPermission === 'function') {
        permission = await handle.queryPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted' && typeof handle.requestPermission === 'function') {
        permission = await handle.requestPermission({ mode: 'readwrite' });
      }
      if (permission === 'granted') {
        await writeHandle(handle, content, 'application/json;charset=utf-8');
        onToast('Salvataggio eseguito con successo.');
        return;
      }
    } catch (e) {}
  }
  await saveAsAppFile(state, onToast);
}
