import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledTariff } from './tariffImportService';

const INVOICES_KEY = '@adka_invoices';
const TARIFF_KEY = '@adka_tariff_version';
const SCHEDULED_TARIFFS_KEY = '@adka_scheduled_tariffs';
const ACTIVE_TARIFF_KEY = '@adka_active_tariff';

export interface StoredInvoice {
  id: string;
  refNumber: string;
  date: string;
  clientName: string;
  clientRef: string;
  brand: 'RENAULT' | 'DACIA';
  modelName: string;
  clientType: string;
  netAPayer: number;
  discountTotal: number;
  data: string; // JSON stringified full calculation
}

export async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  const existing = await loadInvoices();
  const updated = [invoice, ...existing];
  await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
}

export async function loadInvoices(): Promise<StoredInvoice[]> {
  const raw = await AsyncStorage.getItem(INVOICES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function deleteInvoice(id: string): Promise<void> {
  const existing = await loadInvoices();
  const updated = existing.filter(i => i.id !== id);
  await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
}

export async function clearAllInvoices(): Promise<void> {
  await AsyncStorage.removeItem(INVOICES_KEY);
}

// ── TARIFF STORAGE ───────────────────────────────────────────────────────

export async function saveScheduledTariff(tariff: ScheduledTariff): Promise<void> {
  const existing = await loadScheduledTariffs();
  // Replace if same id, otherwise prepend
  const filtered = existing.filter(t => t.id !== tariff.id);
  const updated = [tariff, ...filtered];
  await AsyncStorage.setItem(SCHEDULED_TARIFFS_KEY, JSON.stringify(updated));
}

export async function loadScheduledTariffs(): Promise<ScheduledTariff[]> {
  const raw = await AsyncStorage.getItem(SCHEDULED_TARIFFS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function deleteScheduledTariff(id: string): Promise<void> {
  const existing = await loadScheduledTariffs();
  const updated = existing.filter(t => t.id !== id);
  await AsyncStorage.setItem(SCHEDULED_TARIFFS_KEY, JSON.stringify(updated));
}

export async function activateTariff(id: string): Promise<void> {
  const tariffs = await loadScheduledTariffs();
  const updated = tariffs.map(t => ({ ...t, isActive: t.id === id }));
  await AsyncStorage.setItem(SCHEDULED_TARIFFS_KEY, JSON.stringify(updated));
  const active = updated.find(t => t.id === id);
  if (active) {
    await AsyncStorage.setItem(ACTIVE_TARIFF_KEY, JSON.stringify(active));
  }
}

export async function getActiveTariff(): Promise<ScheduledTariff | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_TARIFF_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearActiveTariff(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_TARIFF_KEY);
  // Reset all scheduled to inactive
  const tariffs = await loadScheduledTariffs();
  const updated = tariffs.map(t => ({ ...t, isActive: false }));
  await AsyncStorage.setItem(SCHEDULED_TARIFFS_KEY, JSON.stringify(updated));
}

/** Check scheduled tariffs and auto-activate one if its effective date has passed */
export async function checkAndApplyScheduledTariff(): Promise<ScheduledTariff | null> {
  const tariffs = await loadScheduledTariffs();
  if (tariffs.length === 0) return null;

  const now = new Date();
  // Find the most recent scheduled tariff whose effective date is today or past
  const eligible = tariffs
    .filter(t => new Date(t.effectiveDate) <= now)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  if (eligible.length === 0) return null;

  const mostRecent = eligible[0];
  const currentActive = await getActiveTariff();

  // Only switch if this tariff is different from the currently active one
  if (!currentActive || currentActive.id !== mostRecent.id) {
    await activateTariff(mostRecent.id);
    return mostRecent;
  }

  return currentActive;
}

// ── INVOICE STORAGE ──────────────────────────────────────────────────────────

export function generateRefNumber(brand: string): string {
  const prefix = brand === 'RENAULT' ? 'REN' : 'DAC';
  const date = new Date();
  const yy = date.getFullYear().toString().slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yy}${mm}-${rand}`;
}
