import { MasterRow } from '../types';

export function newId(): string {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function blankMaster(): MasterRow {
  return { id: newId(), diameter: '', qty: '', length: '' };
}

export function isBlankMaster(row: MasterRow): boolean {
  return !String(row.diameter ?? '').trim() && !String(row.qty ?? '').trim() && !String(row.length ?? '').trim();
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round((value + Number.EPSILON * Math.sign(value || 1)) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function snapFloatingNoiseToInteger(value: number): number {
  if (!Number.isFinite(value)) return value;
  const nearest = Math.round(value);
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 2;
  return Math.abs(value - nearest) <= tolerance ? (Object.is(nearest, -0) ? 0 : nearest) : value;
}

export function inputNumber(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(raw) ? snapFloatingNoiseToInteger(raw) : null;
}

export function normalizeFieldValue(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const raw = String(value).trim();
  const numeric = inputNumber(value);
  return Number.isFinite(numeric) ? String(numeric) : raw;
}

export function valNumber(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const v = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(v) ? round2(v) : null;
}

export function n(value: unknown): number {
  const v = valNumber(value);
  return v === null ? NaN : v;
}

export function validDiameter(d: number | null): boolean {
  return d !== null && Number.isInteger(d) && d >= 6 && d <= 40 && d % 2 === 0;
}

export function unitWeight(dia: number | string | null): number {
  const d = n(dia);
  return Number.isFinite(d) && d > 0 ? Math.round(Math.PI * Math.pow(d / 1000 / 2, 2) * 7850 * 1000) / 1000 : 0;
}

export function fmt(value: number | string | null | undefined, digits: number = 2): string {
  if (!Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

export function intFmt(value: number | null | undefined): string {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(value || 0);
}

export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] || c));
}

export function resultKey(diameter: number | string, length: number | string): string {
  return `${Number(diameter)}|${Number(length)}`;
}

export function validMasterRows(rows: MasterRow[]): MasterRow[] {
  return rows.filter(r => {
    const q = inputNumber(r.qty);
    const l = inputNumber(r.length);
    const d = inputNumber(r.diameter);
    return Number.isInteger(q) && q! > 0 && q! <= 10000 && Number.isInteger(l) && l! > 0 && l! <= 1200 && validDiameter(d);
  });
}

export function masterStats(rows: MasterRow[]): { totalQty: number; totalMeters: number; totalWeight: number } {
  let totalQty = 0;
  let totalMeters = 0;
  let totalWeight = 0;
  for (const r of validMasterRows(rows)) {
    const q = inputNumber(r.qty)!;
    const len = inputNumber(r.length)!;
    const dia = inputNumber(r.diameter)!;
    totalQty += q;
    totalMeters += (q * len) / 100;
    totalWeight += (q * len / 100) * unitWeight(dia);
  }
  return { totalQty, totalMeters, totalWeight };
}
