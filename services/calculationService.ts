import { VehicleModel, VehicleOption, FRAIS_ENREGISTREMENT_STANDARD } from '../constants/tariff';
import { Accessory } from '../constants/accessories';

export type ClientType = 'particulier' | 'loueur' | 'entreprise' | 'convention' | 'taxieur';

export interface SelectedAccessory {
  accessory: Accessory;
  quantity: number;
}

export interface SelectedOption {
  option: VehicleOption;
  quantity: number;
}

export interface PaintOption {
  isMetallic: boolean;
  priceHT: number;
  priceTTC: number;
}

export interface CalculationInput {
  model: VehicleModel;
  clientType: ClientType;
  discountPercent: number;       // % remise client (saisie manuelle)
  flashPercent: number;          // % flash marketing (saisie manuelle)
  accessories: SelectedAccessory[];
  selectedOptions: SelectedOption[];   // model-specific options
  paint: PaintOption;
  clientName?: string;
  clientRef?: string;
  conseiller?: string;
  chassisNumber?: string;
  naturesDossier?: string;
}

export interface PriceBreakdown {
  // Vehicle
  vehiclePriceTTC: number;
  vehiclePriceHT: number;
  tvaRate: number;

  // Paint
  paintPriceHT: number;
  paintPriceTTC: number;

  // Vehicle options (from tariff)
  vehicleOptionsTotalHT: number;
  vehicleOptionsTotalTTC: number;

  // Generic accessories
  accessoriesTotalHT: number;
  accessoriesTotalTTC: number;

  // Discounts
  discountPercent: number;
  discountTTC: number;
  discountHT: number;
  flashPercent: number;
  flashTTC: number;
  flashHT: number;
  totalDiscountPercent: number;
  totalDiscountTTC: number;
  totalDiscountHT: number;

  // Suggested client-type discount
  suggestedDiscount: number | null;

  // Fees
  fraisMiseEnServiceHT: number;
  fraisMiseEnServiceTTC: number;
  fraisEnregistrement: number;
  fraisTransport: number;

  // Totals
  netVehiclePriceTTC: number;  // After discount
  netVehiclePriceHT: number;

  totalHTTaux10: number;       // Vehicle HT if TVA10
  totalTVA10: number;
  totalHTTaux20: number;       // FMS + accessories + paint HT
  totalTVA20: number;

  prixTTCAvantFrais: number;   // NET vehicle + accessories + paint + TVAs
  netAPayer: number;           // Final total

  // Public info
  pricePublic: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getClientTypeDiscount(model: VehicleModel, clientType: ClientType): number | null {
  switch (clientType) {
    case 'particulier': return model.discountParticulier;
    case 'loueur':      return model.discountLoueur;
    case 'entreprise':  return model.discountEntreprise;
    case 'convention':  return model.discountConvention;
    case 'taxieur':     return null;
    default:            return null;
  }
}

export function calculate(input: CalculationInput): PriceBreakdown {
  const { model, clientType, discountPercent, flashPercent, accessories, selectedOptions = [], paint } = input;

  const vehiclePriceTTC = model.priceTTC;
  const vehiclePriceHT = model.priceHT;
  const tvaRate = model.tvaRate;

  // Paint prices (always at 20% TVA)
  const paintPriceHT = paint.isMetallic ? paint.priceHT : 0;
  const paintPriceTTC = round2(paintPriceHT * 1.2);

  // Vehicle options from tariff sheet (at their own TVA rate, typically 20%)
  const vehicleOptionsTotalHT = round2(
    selectedOptions.reduce((sum, so) => sum + so.option.priceHT * so.quantity, 0)
  );
  const vehicleOptionsTotalTTC = round2(
    selectedOptions.reduce((sum, so) => sum + so.option.priceTTC * so.quantity, 0)
  );

  // Generic accessories (at 20% TVA)
  const accessoriesTotalHT = round2(
    accessories.reduce((sum, sa) => sum + sa.accessory.priceHT * sa.quantity, 0)
  );
  const accessoriesTotalTTC = round2(accessoriesTotalHT * 1.2);

  // Discounts apply to vehicle price TTC only
  const discountTTC = round2(vehiclePriceTTC * (discountPercent / 100));
  const discountHT = round2(discountTTC / (1 + tvaRate / 100));
  const flashTTC = round2(vehiclePriceTTC * (flashPercent / 100));
  const flashHT = round2(flashTTC / (1 + tvaRate / 100));

  const totalDiscountPercent = discountPercent + flashPercent;
  const totalDiscountTTC = round2(discountTTC + flashTTC);
  const totalDiscountHT = round2(discountHT + flashHT);

  // Net vehicle price after discounts
  const netVehiclePriceTTC = round2(vehiclePriceTTC - totalDiscountTTC);
  const netVehiclePriceHT = round2(vehiclePriceHT - totalDiscountHT);

  // Frais de mise en service (always at 20% TVA)
  const fraisMiseEnServiceHT = round2(model.fraisMiseEnService);
  const fraisMiseEnServiceTTC = round2(fraisMiseEnServiceHT * 1.2);

  const fraisEnregistrement = FRAIS_ENREGISTREMENT_STANDARD;
  const fraisTransport = model.fraisTransport;

  // TVA breakdown (for invoice)
  // Vehicle at its TVA rate
  let totalHTTaux10 = 0;
  let totalTVA10 = 0;
  let totalHTTaux20 = 0;
  let totalTVA20 = 0;

  if (tvaRate === 10) {
    totalHTTaux10 = round2(netVehiclePriceHT);
    totalTVA10 = round2(totalHTTaux10 * 0.10);
    // 20% base: FMS + paint + accessories + vehicle options
    totalHTTaux20 = round2(fraisMiseEnServiceHT + paintPriceHT + accessoriesTotalHT + vehicleOptionsTotalHT);
    totalTVA20 = round2(totalHTTaux20 * 0.20);
  } else {
    // 20% vehicle + everything else
    totalHTTaux20 = round2(netVehiclePriceHT + fraisMiseEnServiceHT + paintPriceHT + accessoriesTotalHT + vehicleOptionsTotalHT);
    totalTVA20 = round2(totalHTTaux20 * 0.20);
  }

  const prixTTCAvantFrais = round2(totalHTTaux10 + totalTVA10 + totalHTTaux20 + totalTVA20);
  const netAPayer = round2(prixTTCAvantFrais + fraisEnregistrement);

  const suggestedDiscount = getClientTypeDiscount(model, clientType);

  return {
    vehiclePriceTTC,
    vehiclePriceHT,
    tvaRate,
    paintPriceHT,
    paintPriceTTC,
    vehicleOptionsTotalHT,
    vehicleOptionsTotalTTC,
    accessoriesTotalHT,
    accessoriesTotalTTC,
    discountPercent,
    discountTTC,
    discountHT,
    flashPercent,
    flashTTC,
    flashHT,
    totalDiscountPercent,
    totalDiscountTTC,
    totalDiscountHT,
    suggestedDiscount,
    fraisMiseEnServiceHT,
    fraisMiseEnServiceTTC,
    fraisEnregistrement,
    fraisTransport,
    netVehiclePriceTTC,
    netVehiclePriceHT,
    totalHTTaux10,
    totalTVA10,
    totalHTTaux20,
    totalTVA20,
    prixTTCAvantFrais,
    netAPayer,
    pricePublic: model.pricePublic,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' Dhs';
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace('.0', '') + ' K Dhs';
  }
  return amount.toFixed(0) + ' Dhs';
}
