/**
 * Tariff Import Service
 * Parses an Excel (.xlsx) tariff file and maps it to VehicleModel[]
 *
 * Expected sheet name: "TARIF"
 * Column layout (0-indexed):
 *  0  – Designation / model name
 *  1  – Prix CLIENT HT
 *  2  – TAUX TVA (10 or 20)
 *  3  – MONTANT TVA
 *  4  – Prix CLIENT TTC
 *  5  – Frais immatriculation
 *  6  – Frais transport TTC
 *  7  – Prix vente public
 *  8  – Peinture métallisée HT
 *  9  – Préparation / FMS HT
 * 11  – Remise entreprise/artco %
 * 13  – Remise particulier %
 * 15  – Remise loueur %
 * 17  – Remise client convention %
 */

import * as XLSX from 'xlsx';
import { VehicleModel } from '../constants/tariff';

export interface ParsedTariff {
  brand: 'RENAULT' | 'DACIA';
  models: VehicleModel[];
}

export interface TariffImportResult {
  success: boolean;
  renaultModels: VehicleModel[];
  daciaModels: VehicleModel[];
  totalModels: number;
  errors: string[];
  warnings: string[];
  sheetName: string;
}

export interface ScheduledTariff {
  id: string;
  label: string;
  effectiveDate: string;   // ISO date string
  importedAt: string;      // ISO timestamp
  renaultModels: VehicleModel[];
  daciaModels: VehicleModel[];
  totalModels: number;
  isActive: boolean;
  sheetName: string;
}

// Brand keywords to detect brand from column/row context
const DACIA_KEYWORDS = ['DACIA', 'dacia'];
const RENAULT_KEYWORDS = ['RENAULT', 'renault', 'CLIO', 'KARDIAN', 'ARKANA', 'AUSTRAL', 'KANGOO', 'EXPRESS', 'TRAFIC', 'MASTER', 'MEGANE'];

// Known category headers (rows that are headers, not models)
const CATEGORY_KEYWORDS = [
  'NOUVELLE STREETWAY', 'NOUVELLE STEPWAY', 'NOUVELLE LOGAN',
  'NOUVEAU DUSTER', 'SPRING', 'NOUVEAU BIGSTER', 'JOGGER',
  'CLIO 5', 'RENAULT KARDIAN', 'ARKANA', 'AUSTRAL', 'KANGOO',
  'RENAULT 5', 'MEGANE 4', 'MEGANE E-TECH', 'EXPRESS', 'EXPRESS VAN',
  'TRAFIC', 'MASTER', 'TAXI', 'GRAND TAXI', 'PETIT TAXI',
  'SUCCURSALE', 'AVRIL', 'TARIF',
];

function isNumeric(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  const n = Number(val);
  return !isNaN(n) && isFinite(n);
}

function safeNum(val: any, fallback = 0): number {
  if (!isNumeric(val)) return fallback;
  return Number(val);
}

function safePercent(val: any): number | null {
  if (val === null || val === undefined || val === '' || val === 0) return null;
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return null;
  // Values can be 0.024 (fraction) or 2.4 (percent) — normalize to fraction
  return Math.abs(n) > 1 ? n / 100 : n;
}

function isCategoryHeader(name: string): boolean {
  const upper = name.toUpperCase().trim();
  return CATEGORY_KEYWORDS.some(kw => upper.includes(kw.toUpperCase()));
}

function isModelRow(row: any[]): boolean {
  const name = row[0];
  const priceHT = row[1];
  const tva = row[2];
  const priceTTC = row[4];

  if (!name || typeof name !== 'string' || name.trim().length < 3) return false;
  if (!isNumeric(priceHT) || safeNum(priceHT) < 10000) return false;
  if (!isNumeric(tva) || (safeNum(tva) !== 10 && safeNum(tva) !== 20)) return false;
  if (!isNumeric(priceTTC) || safeNum(priceTTC) < 10000) return false;

  return true;
}

function detectBrandFromContext(rows: any[][], currentIndex: number): 'RENAULT' | 'DACIA' | null {
  // Look backwards for a brand marker row
  for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 20); i--) {
    const cell = String(rows[i][0] || rows[i][6] || '').toUpperCase();
    if (DACIA_KEYWORDS.some(k => cell.includes(k.toUpperCase()))) return 'DACIA';
    if (RENAULT_KEYWORDS.some(k => cell.includes(k.toUpperCase()))) return 'RENAULT';
  }
  return null;
}

function detectBrandFromModelName(name: string): 'RENAULT' | 'DACIA' | null {
  const upper = name.toUpperCase();
  const daciaModels = ['STREETWAY', 'STEPWAY', 'LOGAN', 'DUSTER', 'SPRING', 'BIGSTER', 'JOGGER', 'SANDERO'];
  const renaultModels = ['CLIO', 'KARDIAN', 'ARKANA', 'AUSTRAL', 'KANGOO', 'EXPRESS', 'TRAFIC', 'MASTER', 'MEGANE', 'R5', 'CAPTUR'];

  for (const m of daciaModels) if (upper.includes(m)) return 'DACIA';
  for (const m of renaultModels) if (upper.includes(m)) return 'RENAULT';
  return null;
}

function getCurrentCategory(rows: any[][], currentIndex: number): string {
  for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 10); i--) {
    const cell = String(rows[i][0] || '').trim();
    if (cell.length > 2 && !isNumeric(cell) && !isModelRow(rows[i])) {
      // Clean up the category name
      return cell
        .replace(/nouvelle\s*/i, 'NOUVELLE ')
        .replace(/nouveau\s*/i, 'NOUVEAU ')
        .toUpperCase()
        .trim();
    }
  }
  return 'AUTRE';
}

let idCounter = 1;
function generateId(brand: 'RENAULT' | 'DACIA', category: string, index: number): string {
  const b = brand === 'RENAULT' ? 'r' : 'd';
  const cat = category.replace(/[^a-zA-Z]/g, '').slice(0, 4).toLowerCase();
  return `${b}-${cat}-${index}`;
}

export function parseTariffWorkbook(data: ArrayBuffer): TariffImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch (e) {
    return {
      success: false,
      renaultModels: [],
      daciaModels: [],
      totalModels: 0,
      errors: ['Impossible de lire le fichier Excel. Vérifiez que c\'est un fichier .xlsx valide.'],
      warnings: [],
      sheetName: '',
    };
  }

  // Find TARIF sheet (case-insensitive)
  const sheetNames = workbook.SheetNames;
  const tarifSheetName = sheetNames.find(s => s.toUpperCase().includes('TARIF')) || sheetNames[0];

  if (!tarifSheetName) {
    errors.push('Aucune feuille "TARIF" trouvée dans le fichier.');
    return { success: false, renaultModels: [], daciaModels: [], totalModels: 0, errors, warnings, sheetName: '' };
  }

  const sheet = workbook.Sheets[tarifSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const renaultModels: VehicleModel[] = [];
  const daciaModels: VehicleModel[] = [];

  // Track state
  let currentBrand: 'RENAULT' | 'DACIA' | null = null;
  let currentCategory = 'AUTRE';
  let categoryCounters: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    const cellZero = String(row[0] || '').trim();
    const cellSix = String(row[6] || '').trim();

    // Detect brand marker rows
    const combined = `${cellZero} ${cellSix}`.toUpperCase();
    if (combined.includes('DACIA') && !isModelRow(row)) {
      currentBrand = 'DACIA';
      continue;
    }
    if ((combined.includes('RENAULT') || combined.includes('CLIO')) && !isModelRow(row)) {
      currentBrand = 'RENAULT';
      continue;
    }

    // Detect category header rows
    if (cellZero.length > 2 && !isNumeric(cellZero) && !isModelRow(row)) {
      if (cellZero.length < 80) {
        currentCategory = cellZero.toUpperCase().trim();
      }
      continue;
    }

    // Process model rows
    if (!isModelRow(row)) continue;

    const modelName = cellZero.trim();
    const priceHT = safeNum(row[1]);
    const tvaRate = safeNum(row[2]);
    const priceTTC = safeNum(row[4]);
    const fraisImmat = safeNum(row[5], 360);
    const fraisTransport = safeNum(row[6], 6840);
    const pricePublic = safeNum(row[7], priceTTC + 7200);
    const paintMetallicHT = safeNum(row[8], 3333.33);
    const fraisMiseEnService = safeNum(row[9], 1933.33);

    // Discount columns
    const discountEntreprise = safePercent(row[11]);
    const discountParticulier = safePercent(row[13]);
    const discountLoueur = safePercent(row[15]);
    const discountConvention = safePercent(row[17]);

    // Determine brand
    let brand = currentBrand;
    if (!brand) {
      brand = detectBrandFromModelName(modelName) || detectBrandFromContext(rows, i);
    }
    if (!brand) {
      warnings.push(`Marque non détectée pour: "${modelName}" — ignorée`);
      continue;
    }

    // Validate critical fields
    if (priceHT < 50000) {
      warnings.push(`Prix HT suspect pour "${modelName}": ${priceHT} — ignorée`);
      continue;
    }
    if (tvaRate !== 10 && tvaRate !== 20) {
      warnings.push(`Taux TVA invalide pour "${modelName}": ${tvaRate}% — ignorée`);
      continue;
    }

    const catKey = `${brand}-${currentCategory}`;
    if (!categoryCounters[catKey]) categoryCounters[catKey] = 1;
    else categoryCounters[catKey]++;

    const model: VehicleModel = {
      id: generateId(brand, currentCategory, categoryCounters[catKey]),
      name: modelName,
      brand,
      category: currentCategory,
      priceHT,
      tvaRate,
      priceTTC,
      pricePublic: pricePublic > priceTTC ? pricePublic : priceTTC + 7200,
      fraisImmat,
      fraisTransport,
      fraisMiseEnService: fraisMiseEnService > 0 ? fraisMiseEnService : 1933.33,
      paintMetallicHT: paintMetallicHT > 0 ? paintMetallicHT : 3333.33,
      discountEntreprise,
      discountParticulier,
      discountLoueur,
      discountConvention,
    };

    if (brand === 'DACIA') daciaModels.push(model);
    else renaultModels.push(model);
  }

  if (renaultModels.length === 0 && daciaModels.length === 0) {
    errors.push(
      'Aucun modèle valide trouvé. Vérifiez que le fichier utilise le format standard ADKA AUTO avec une feuille "TARIF".'
    );
    return {
      success: false, renaultModels, daciaModels,
      totalModels: 0, errors, warnings, sheetName: tarifSheetName,
    };
  }

  if (renaultModels.length < 3) {
    warnings.push(`Seulement ${renaultModels.length} modèles RENAULT détectés — résultat peut-être incomplet.`);
  }
  if (daciaModels.length < 3) {
    warnings.push(`Seulement ${daciaModels.length} modèles DACIA détectés — résultat peut-être incomplet.`);
  }

  return {
    success: true,
    renaultModels,
    daciaModels,
    totalModels: renaultModels.length + daciaModels.length,
    errors,
    warnings,
    sheetName: tarifSheetName,
  };
}

export function validateTariffResult(result: TariffImportResult): string[] {
  const issues: string[] = [];

  const allModels = [...result.renaultModels, ...result.daciaModels];
  const names = allModels.map(m => m.name);
  const unique = new Set(names);
  if (unique.size < names.length) {
    issues.push(`${names.length - unique.size} modèle(s) en double détectés.`);
  }

  allModels.forEach(m => {
    if (m.priceTTC < m.priceHT) {
      issues.push(`Prix TTC < prix HT pour "${m.name}"`);
    }
    if (m.fraisMiseEnService <= 0) {
      issues.push(`Frais de mise en service manquants pour "${m.name}"`);
    }
  });

  return issues;
}
