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
import { VehicleModel, VehicleOption } from '../constants/tariff';

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

// ── OPTION PARSING ───────────────────────────────────────────────────────────

/**
 * Parse the OPTIONS section from a model-specific sheet.
 * Looks for a row containing "Designation équipements" in col 2 (0-indexed),
 * then reads rows until it hits an empty designation.
 */
export function parseOptionsFromSheet(
  sheet: XLSX.WorkSheet,
  modelIdPrefix: string
): VehicleOption[] {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const options: VehicleOption[] = [];

  let headerRowIndex = -1;
  let trimHeaders: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cell2 = String(row[2] || '').toLowerCase();
    // Look for the options header row
    if (cell2.includes('designation') || cell2.includes('d\u00e9signation')) {
      headerRowIndex = i;
      // Trim names start from col 8 onwards
      trimHeaders = [];
      for (let c = 8; c < Math.min(row.length, 14); c++) {
        const h = String(row[c] || '').trim();
        if (h && h !== 'NaN') trimHeaders.push(h.toUpperCase());
      }
      continue;
    }

    // Skip the price label row right after header (CLIENT HT, TVA, etc.)
    if (headerRowIndex >= 0 && i === headerRowIndex + 1) continue;

    if (headerRowIndex >= 0 && i > headerRowIndex + 1) {
      const name = String(row[2] || '').trim();
      if (!name || name === 'NaN' || name.length < 2) {
        // Stop at first empty row after options start
        if (options.length > 0) break;
        continue;
      }

      const priceHT = safeNum(row[4]);
      const tvaRate = safeNum(row[5], 20);
      const priceTTC = safeNum(row[7]);
      const code = String(row[3] || '').trim().replace('NaN', '');

      // Determine which trims this option is available on
      const availableOn: string[] = [];
      for (let c = 8; c < 8 + trimHeaders.length && c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (val === 'X' || val === 'x') {
          const trimName = trimHeaders[c - 8];
          if (trimName) availableOn.push(trimName);
        }
      }

      // Only include options with a real price or known free options (price 0 but explicitly listed)
      if (name && (priceTTC > 0 || priceHT >= 0)) {
        options.push({
          id: `${modelIdPrefix}-opt-${options.length + 1}`,
          name,
          code,
          priceHT,
          tvaRate: tvaRate || 20,
          priceTTC,
          availableOn,
        });
      }
    }
  }

  return options;
}

/**
 * Match individual model sheets to parsed VehicleModel entries and attach their options.
 * Uses fuzzy matching on sheet name vs. model category.
 */
function attachOptionsFromSheets(
  workbook: XLSX.WorkBook,
  models: VehicleModel[]
): VehicleModel[] {
  // Build a map of sheetName -> options
  const sheetOptionsMap: Record<string, VehicleOption[]> = {};

  for (const sheetName of workbook.SheetNames) {
    const upperSheet = sheetName.toUpperCase().trim();
    // Skip summary/recap sheets
    if (
      upperSheet.includes('TARIF') ||
      upperSheet.includes('RECAP') ||
      upperSheet.includes('MARGE') ||
      upperSheet.includes('R\u00c9SEAU') ||
      upperSheet.includes('RESEAU') ||
      upperSheet.includes('DACIA') ||
      upperSheet.includes('REMISE')
    ) continue;

    const sheet = workbook.Sheets[sheetName];
    const prefix = upperSheet.replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const opts = parseOptionsFromSheet(sheet, prefix.toLowerCase());
    if (opts.length > 0) {
      sheetOptionsMap[upperSheet] = opts;
    }
  }

  // Match each model to the best sheet
  return models.map(model => {
    const catUpper = model.category.toUpperCase();
    const nameUpper = model.name.toUpperCase();

    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const sheetName of Object.keys(sheetOptionsMap)) {
      // Score based on keyword overlap
      const keywords = sheetName.split(/[\s_]+/);
      let score = 0;
      for (const kw of keywords) {
        if (kw.length < 2) continue;
        if (catUpper.includes(kw) || nameUpper.includes(kw)) score += kw.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sheetName;
      }
    }

    if (bestMatch && bestScore >= 4) {
      return { ...model, options: sheetOptionsMap[bestMatch] };
    }
    return model;
  });
}

// ── WORKBOOK PARSING ──────────────────────────────────────────────────────────

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

  // Attach model-specific options from individual sheets
  const enrichedRenault = attachOptionsFromSheets(workbook, renaultModels);
  const enrichedDacia = attachOptionsFromSheets(workbook, daciaModels);

  if (enrichedRenault.length === 0 && enrichedDacia.length === 0) {
    errors.push(
      'Aucun modèle valide trouvé. Vérifiez que le fichier utilise le format standard ADKA AUTO avec une feuille "TARIF".'
    );
    return {
      success: false, renaultModels: enrichedRenault, daciaModels: enrichedDacia,
      totalModels: 0, errors, warnings, sheetName: tarifSheetName,
    };
  }

  if (enrichedRenault.length < 3) {
    warnings.push(`Seulement ${enrichedRenault.length} mod\u00e8les RENAULT d\u00e9tect\u00e9s \u2014 r\u00e9sultat peut-\u00eatre incomplet.`);
  }
  if (enrichedDacia.length < 3) {
    warnings.push(`Seulement ${enrichedDacia.length} mod\u00e8les DACIA d\u00e9tect\u00e9s \u2014 r\u00e9sultat peut-\u00eatre incomplet.`);
  }

  const optionsWithData = [...enrichedRenault, ...enrichedDacia].filter(m => m.options && m.options.length > 0).length;
  if (optionsWithData > 0) {
    warnings.push(`\u2705 Options extraites pour ${optionsWithData} mod\u00e8le(s) depuis les feuilles individuelles.`);
  }

  return {
    success: true,
    renaultModels: enrichedRenault,
    daciaModels: enrichedDacia,
    totalModels: enrichedRenault.length + enrichedDacia.length,
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
