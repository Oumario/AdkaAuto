// ADKA AUTO — Embedded Tariff Data (from Excel TARIF sheet — Avril 2025)

export interface VehicleModel {
  id: string;
  name: string;
  brand: 'RENAULT' | 'DACIA';
  category: string;
  priceHT: number;        // Prix CLIENT HT
  tvaRate: number;        // TVA rate in % (10 or 20)
  priceTTC: number;       // Prix CLIENT TTC
  pricePublic: number;    // Prix vente public TTC
  fraisImmat: number;     // Frais immatriculation
  fraisTransport: number; // Frais transport TTC
  fraisMiseEnService: number; // FMS HT
  paintMetallicHT: number;    // Peinture métallisée HT
  // Client-type specific discounts (%)
  discountEntreprise: number | null;
  discountParticulier: number | null;
  discountLoueur: number | null;
  discountConvention: number | null;
}

export const TARIFF_VERSION = {
  label: 'Avril 2025',
  date: '2025-04-01',
  updatedBy: 'Admin',
};

const FRAIS_ENREGISTREMENT_STANDARD = 4650;
const FRAIS_ENREGISTREMENT_TAXI = 6560;

export { FRAIS_ENREGISTREMENT_STANDARD, FRAIS_ENREGISTREMENT_TAXI };

export const VEHICLE_MODELS: VehicleModel[] = [
  // ─── DACIA ────────────────────────────────────────────────────────────────
  // NOUVELLE STREETWAY
  {
    id: 'd-sw-1', brand: 'DACIA', category: 'NOUVELLE STREETWAY',
    name: 'Streetway Essential 1,0 TCe 100 ch MY25 EURO6',
    priceHT: 120000, tvaRate: 10, priceTTC: 130000, pricePublic: 137200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sw-2', brand: 'DACIA', category: 'NOUVELLE STREETWAY',
    name: 'Streetway Essential 1,0 TCe 100 ch CVT MY25 EURO6',
    priceHT: 132727.27, tvaRate: 10, priceTTC: 147000, pricePublic: 154200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sw-3', brand: 'DACIA', category: 'NOUVELLE STREETWAY',
    name: 'Streetway Essential 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 138181.82, tvaRate: 10, priceTTC: 159500, pricePublic: 166700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sw-4', brand: 'DACIA', category: 'NOUVELLE STREETWAY',
    name: 'Streetway Expression 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 150000, tvaRate: 10, priceTTC: 166500, pricePublic: 173700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sw-5', brand: 'DACIA', category: 'NOUVELLE STREETWAY',
    name: 'Streetway Journey 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 157272.73, tvaRate: 10, priceTTC: 166500, pricePublic: 173700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // NOUVELLE STEPWAY
  {
    id: 'd-sty-1', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Essential 1,0 TCe 100 ch CVT MY25 EURO6',
    priceHT: 143636.36, tvaRate: 10, priceTTC: 159500, pricePublic: 166700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sty-2', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Essential 1,5 Blue dCi 102 ch MY25 EURO6',
    priceHT: 150000, tvaRate: 10, priceTTC: 162500, pricePublic: 169700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sty-3', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Expression 1,0 TCe 100 ch CVT EURO6',
    priceHT: 153636.36, tvaRate: 10, priceTTC: 172000, pricePublic: 179200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sty-4', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Expression 1,5 Blue dCi 102 ch MY25 EURO6',
    priceHT: 160000, tvaRate: 10, priceTTC: 175000, pricePublic: 182200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sty-5', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Extreme 1,0 TCe 100 ch CVT MY25 EURO6',
    priceHT: 163636.36, tvaRate: 10, priceTTC: 183000, pricePublic: 190200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-sty-6', brand: 'DACIA', category: 'NOUVELLE STEPWAY',
    name: 'Stepway Extreme 1,5 Blue dCi 102 ch MY25 EURO6',
    priceHT: 170000, tvaRate: 10, priceTTC: 186000, pricePublic: 193200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: 0, discountParticulier: 0, discountLoueur: 0, discountConvention: 0,
  },
  // NOUVELLE LOGAN
  {
    id: 'd-lg-1', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Essential 1,0 TCe 100 ch MY25 EURO6',
    priceHT: 126363.64, tvaRate: 10, priceTTC: 134000, pricePublic: 141200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-lg-2', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Essential 1,0 TCe 100 ch CVT MY25 EURO6',
    priceHT: 139090.91, tvaRate: 10, priceTTC: 148000, pricePublic: 155200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-lg-3', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Essential 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 141818.18, tvaRate: 10, priceTTC: 151000, pricePublic: 158200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-lg-4', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Expression 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 151818.18, tvaRate: 10, priceTTC: 159500, pricePublic: 166700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-lg-5', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Journey 1,0 TCe 100 ch CVT MY25 EURO6',
    priceHT: 157727.27, tvaRate: 10, priceTTC: 162500, pricePublic: 169700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-lg-6', brand: 'DACIA', category: 'NOUVELLE LOGAN',
    name: 'LOGAN Journey 1,5 Blue dCi 95 ch MY25 EURO6',
    priceHT: 160454.55, tvaRate: 10, priceTTC: 172500, pricePublic: 179700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // NOUVEAU DUSTER
  {
    id: 'd-du-1', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Essential 1,5 dCi 115 ch 2WD EURO6',
    priceHT: 193333.33, tvaRate: 20, priceTTC: 226900, pricePublic: 234100,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-du-2', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Expression 1,5 dCi 115 ch 2WD EURO6',
    priceHT: 207500, tvaRate: 20, priceTTC: 223000, pricePublic: 230200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-du-3', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Journey 1,5 dCi 115 ch 2WD EURO6',
    priceHT: 221666.67, tvaRate: 20, priceTTC: 213000, pricePublic: 220200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-du-4', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Extreme 1,5 dCi 115 ch 2WD EURO6',
    priceHT: 221666.67, tvaRate: 20, priceTTC: 237500, pricePublic: 244700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-du-5', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Expression 1,3 TCe 150 ch',
    priceHT: 195416.67, tvaRate: 20, priceTTC: 237500, pricePublic: 244700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-du-6', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER Journey 1,3 TCe 150 ch',
    priceHT: 209583.33, tvaRate: 20, priceTTC: 237500, pricePublic: 244700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-du-7', brand: 'DACIA', category: 'NOUVEAU DUSTER',
    name: 'DUSTER EXTREME 1,3 TCe 150 ch',
    priceHT: 209583.33, tvaRate: 20, priceTTC: 237500, pricePublic: 244700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // SPRING
  {
    id: 'd-sp-1', brand: 'DACIA', category: 'SPRING',
    name: 'SPRING Extreme Electrique 65ch',
    priceHT: 179166.67, tvaRate: 20, priceTTC: 237500, pricePublic: 244700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  // NOUVEAU BIGSTER
  {
    id: 'd-bg-1', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER Essential 1,5 Blue dCi 115 ch 2WD Euro6',
    priceHT: 220416.67, tvaRate: 20, priceTTC: 199000, pricePublic: 206200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'd-bg-2', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER Expression 1,5 Blue dCi 115 ch 2WD Euro6',
    priceHT: 229583.33, tvaRate: 20, priceTTC: 199000, pricePublic: 206200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-bg-3', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER JOURNEY 1,5 Blue dCi 115 ch 2WD Euro6',
    priceHT: 247916.67, tvaRate: 20, priceTTC: 209000, pricePublic: 216200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-bg-4', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER EXTREME 1,5 Blue dCi 115 ch 2WD Euro6',
    priceHT: 247916.67, tvaRate: 20, priceTTC: 209000, pricePublic: 216200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-bg-5', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER Expression Hybrid 155 ch 2WD Euro6',
    priceHT: 244166.67, tvaRate: 20, priceTTC: 209000, pricePublic: 216200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-bg-6', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER EXTREME Hybrid 155 ch 2WD Euro6',
    priceHT: 262500, tvaRate: 20, priceTTC: 209000, pricePublic: 216200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  {
    id: 'd-bg-7', brand: 'DACIA', category: 'NOUVEAU BIGSTER',
    name: 'BIGSTER JOURNEY Hybrid 155 ch 2WD Euro6',
    priceHT: 262500, tvaRate: 20, priceTTC: 209000, pricePublic: 216200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: 0.024, discountParticulier: 0.016, discountLoueur: 0.016, discountConvention: 0.032,
  },
  // JOGGER
  {
    id: 'd-jg-1', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Essential 7 Places 1,5 Blue Dci BVM5 102ch MY25',
    priceHT: 178090.91, tvaRate: 10, priceTTC: 183500, pricePublic: 190700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.2, discountParticulier: 0.048, discountLoueur: 0.2, discountConvention: 0.064,
  },
  {
    id: 'd-jg-2', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Expression 5 Places 1,5 Blue Dci BVM5 102ch',
    priceHT: 187181.82, tvaRate: 10, priceTTC: 165000, pricePublic: 172200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.192, discountParticulier: 0.048, discountLoueur: 0.192, discountConvention: 0.064,
  },
  {
    id: 'd-jg-3', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Extreme 5 Places 1,5 Blue Dci BVM5 102ch',
    priceHT: 197181.82, tvaRate: 10, priceTTC: 165000, pricePublic: 172200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.192, discountParticulier: 0.048, discountLoueur: 0.192, discountConvention: 0.064,
  },
  {
    id: 'd-jg-4', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Expression 7 Places 1,5 Blue Dci BVM5 102ch MY25',
    priceHT: 195363.64, tvaRate: 10, priceTTC: 183500, pricePublic: 190700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.2, discountParticulier: 0.048, discountLoueur: 0.2, discountConvention: 0.064,
  },
  {
    id: 'd-jg-5', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Extreme 7 Places 1,5 Blue Dci BVM5 102ch MY25',
    priceHT: 207181.82, tvaRate: 10, priceTTC: 183500, pricePublic: 190700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.2, discountParticulier: 0.048, discountLoueur: 0.2, discountConvention: 0.064,
  },
  {
    id: 'd-jg-6', brand: 'DACIA', category: 'JOGGER',
    name: 'JOGGER Extreme HEV 7 Places 1,6L Hybrid 140ch',
    priceHT: 233545.45, tvaRate: 10, priceTTC: 165000, pricePublic: 172200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: 0.192, discountParticulier: 0.048, discountLoueur: 0.192, discountConvention: 0.064,
  },

  // ─── RENAULT ────────────────────────────────────────────────────────────────
  // CLIO 5
  {
    id: 'r-cl-1', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Authentic Plus TCe 100ch CVT MY25',
    priceHT: 172916.67, tvaRate: 20, priceTTC: 196000, pricePublic: 203200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-2', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Equilibre TCe 100ch CVT MY25',
    priceHT: 186250, tvaRate: 20, priceTTC: 211000, pricePublic: 218200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-3', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Authentic Plus 1,5 dCi 115ch MY25',
    priceHT: 177083.33, tvaRate: 20, priceTTC: 199000, pricePublic: 206200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-4', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Equilibre 1,5 dCi 115ch MY25',
    priceHT: 190416.67, tvaRate: 20, priceTTC: 214000, pricePublic: 221200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-5', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Esprit Alpine 1,5 dCi 115ch MY25',
    priceHT: 210416.67, tvaRate: 20, priceTTC: 237000, pricePublic: 244200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-6', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Equilibre full hybrid E-Tech MY25',
    priceHT: 215416.67, tvaRate: 20, priceTTC: 254000, pricePublic: 261200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-cl-7', brand: 'RENAULT', category: 'CLIO 5',
    name: 'Clio Esprit Alpine full hybrid E-Tech MY25',
    priceHT: 235416.67, tvaRate: 20, priceTTC: 277000, pricePublic: 284200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3750,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // RENAULT KARDIAN
  {
    id: 'r-kd-1', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'Kardian Equilibre 1L TCe 100 ch CVT',
    priceHT: 160909.09, tvaRate: 10, priceTTC: 174000, pricePublic: 181200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kd-2', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'KARDIAN EQUILIBRE 1L TCe 100 ch',
    priceHT: 165454.55, tvaRate: 10, priceTTC: 179000, pricePublic: 186200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kd-3', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'KARDIAN TECHNO 1L TCe 100 ch',
    priceHT: 180000, tvaRate: 10, priceTTC: 195000, pricePublic: 204700,
    fraisImmat: 360, fraisTransport: 9340, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kd-4', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'KARDIAN TECHNO TCe CVT',
    priceHT: 175454.55, tvaRate: 10, priceTTC: 190000, pricePublic: 197200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kd-5', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'KARDIAN ICONIC 1L TCe 100 ch',
    priceHT: 189090.91, tvaRate: 10, priceTTC: 205000, pricePublic: 214700,
    fraisImmat: 360, fraisTransport: 9340, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kd-6', brand: 'RENAULT', category: 'RENAULT KARDIAN',
    name: 'KARDIAN ICONIC TCe CVT',
    priceHT: 184545.45, tvaRate: 10, priceTTC: 200000, pricePublic: 209700,
    fraisImmat: 360, fraisTransport: 9340, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // ARKANA
  {
    id: 'r-ak-1', brand: 'RENAULT', category: 'ARKANA',
    name: 'Arkana Equilibre E-tech full Hybrid 1,6L 145 ch',
    priceHT: 263333.33, tvaRate: 20, priceTTC: 316000, pricePublic: 323200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ak-2', brand: 'RENAULT', category: 'ARKANA',
    name: 'Arkana Techno E-tech full Hybrid 1,6L 145 ch',
    priceHT: 250000, tvaRate: 20, priceTTC: 336000, pricePublic: 343200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ak-3', brand: 'RENAULT', category: 'ARKANA',
    name: 'Arkana Ph2 Esprit Alpine E-tech full Hybrid 1,6L 145 ch',
    priceHT: 275000, tvaRate: 20, priceTTC: 356000, pricePublic: 363200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // AUSTRAL
  {
    id: 'r-au-1', brand: 'RENAULT', category: 'AUSTRAL',
    name: 'Austral Equilibre Mild Hybrid 1,3L 150 ch Boite Auto',
    priceHT: 283333.33, tvaRate: 20, priceTTC: 340000, pricePublic: 347200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-au-2', brand: 'RENAULT', category: 'AUSTRAL',
    name: 'Austral Equilibre E-tech full Hybrid 1,2L 200 ch',
    priceHT: 300000, tvaRate: 20, priceTTC: 360000, pricePublic: 367200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-au-3', brand: 'RENAULT', category: 'AUSTRAL',
    name: 'Austral Techno E-tech full Hybrid 1,2L 200 ch MY25',
    priceHT: 300000, tvaRate: 20, priceTTC: 380000, pricePublic: 387200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-au-4', brand: 'RENAULT', category: 'AUSTRAL',
    name: 'Austral Esprit Alpine E-tech full Hybrid 1,2L 200 ch MY25',
    priceHT: 329166.67, tvaRate: 20, priceTTC: 405000, pricePublic: 412200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // KANGOO
  {
    id: 'r-kg-1', brand: 'RENAULT', category: 'KANGOO',
    name: 'Kangoo Equilibre 1,5 dCi 115 ch',
    priceHT: 208750, tvaRate: 20, priceTTC: 268000, pricePublic: 275200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kg-2', brand: 'RENAULT', category: 'KANGOO',
    name: 'Kangoo Equilibre 1,5 dCi 115 ch boite auto EDC',
    priceHT: 242083.33, tvaRate: 20, priceTTC: 290000, pricePublic: 297200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-kg-3', brand: 'RENAULT', category: 'KANGOO',
    name: 'Kangoo Techno 1,5 dCi 115 ch boite auto EDC',
    priceHT: 254583.33, tvaRate: 20, priceTTC: 315000, pricePublic: 322200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // RENAULT 5
  {
    id: 'r-r5-1', brand: 'RENAULT', category: 'RENAULT 5',
    name: 'R5 Equilibre 122ch autonomie urbaine AC11',
    priceHT: 241666.67, tvaRate: 20, priceTTC: 315000, pricePublic: 322200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // MEGANE 4
  {
    id: 'r-mg-1', brand: 'RENAULT', category: 'MEGANE 4',
    name: 'Megane 4 Sedan New Equilibre 1,5 dCi 115 ch EDC EURO6',
    priceHT: 257916.67, tvaRate: 20, priceTTC: 308000, pricePublic: 315200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4583.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-mg-2', brand: 'RENAULT', category: 'MEGANE 4',
    name: 'Megane 4 Sedan New Techno 1,5 dCi 115 ch EDC EURO6',
    priceHT: 274583.33, tvaRate: 20, priceTTC: 328000, pricePublic: 335200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4583.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // MEGANE E-TECH
  {
    id: 'r-me-1', brand: 'RENAULT', category: 'MEGANE E-TECH',
    name: 'MEGANE E TECH ELECTRIQUE',
    priceHT: 351666.67, tvaRate: 20, priceTTC: 298900, pricePublic: 304350,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 6666.66,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // EXPRESS
  {
    id: 'r-ex-1', brand: 'RENAULT', category: 'EXPRESS',
    name: 'Express Authentic 1,5 dCi 95 ch EURO6',
    priceHT: 161818.18, tvaRate: 10, priceTTC: 171000, pricePublic: 178200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ex-2', brand: 'RENAULT', category: 'EXPRESS',
    name: 'Express Equilibre 1,5 dCi 95 ch EURO6',
    priceHT: 170000, tvaRate: 10, priceTTC: 180000, pricePublic: 187200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ex-3', brand: 'RENAULT', category: 'EXPRESS',
    name: 'Express Techno 1,5 dCi 95 ch EURO6',
    priceHT: 180909.09, tvaRate: 10, priceTTC: 192000, pricePublic: 199200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 3333.33,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // EXPRESS VAN
  {
    id: 'r-ev-1', brand: 'RENAULT', category: 'EXPRESS VAN',
    name: 'Express VAN Start 1,5 dCi 95 ch',
    priceHT: 140909.09, tvaRate: 10, priceTTC: 156500, pricePublic: 163700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ev-2', brand: 'RENAULT', category: 'EXPRESS VAN',
    name: 'Express VAN Advance 1,5 dCi 95 ch',
    priceHT: 147272.73, tvaRate: 10, priceTTC: 163500, pricePublic: 170700,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 2916.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // TRAFIC
  {
    id: 'r-tr-1', brand: 'RENAULT', category: 'TRAFIC',
    name: 'Trafic VAN NBI L1H1',
    priceHT: 267500, tvaRate: 20, priceTTC: 297000, pricePublic: 304200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-tr-2', brand: 'RENAULT', category: 'TRAFIC',
    name: 'Trafic VAN NBI L2H1',
    priceHT: 280833.33, tvaRate: 20, priceTTC: 312000, pricePublic: 319200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-tr-3', brand: 'RENAULT', category: 'TRAFIC',
    name: 'Trafic VAN Phase 2 L2H2',
    priceHT: 282500, tvaRate: 20, priceTTC: 327000, pricePublic: 334200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-tr-4', brand: 'RENAULT', category: 'TRAFIC',
    name: 'Trafic Combi Phase 2 L1H1',
    priceHT: 306666.67, tvaRate: 20, priceTTC: 362000, pricePublic: 369200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-tr-5', brand: 'RENAULT', category: 'TRAFIC',
    name: 'Trafic Combi Phase 2 L2H1',
    priceHT: 324166.67, tvaRate: 20, priceTTC: 377000, pricePublic: 384200,
    fraisImmat: 360, fraisTransport: 6840, fraisMiseEnService: 1933.33,
    paintMetallicHT: 4166.67,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  // MASTER
  {
    id: 'r-ms-1', brand: 'RENAULT', category: 'MASTER',
    name: 'Master L2H2',
    priceHT: 290000, tvaRate: 20, priceTTC: 335000, pricePublic: 340450,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ms-2', brand: 'RENAULT', category: 'MASTER',
    name: 'Master L3H2',
    priceHT: 312500, tvaRate: 20, priceTTC: 342000, pricePublic: 347450,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ms-3', brand: 'RENAULT', category: 'MASTER',
    name: 'Master L3H3',
    priceHT: 320833.33, tvaRate: 20, priceTTC: 345000, pricePublic: 350450,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ms-4', brand: 'RENAULT', category: 'MASTER',
    name: 'Master L4H2',
    priceHT: 330833.33, tvaRate: 20, priceTTC: 384000, pricePublic: 389450,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
  {
    id: 'r-ms-5', brand: 'RENAULT', category: 'MASTER',
    name: 'Master L4H3',
    priceHT: 350000, tvaRate: 20, priceTTC: 388000, pricePublic: 393450,
    fraisImmat: 360, fraisTransport: 5090, fraisMiseEnService: 1933.33,
    paintMetallicHT: 5000,
    discountEntreprise: null, discountParticulier: null, discountLoueur: null, discountConvention: null,
  },
];

export function getModelsByBrand(brand: 'RENAULT' | 'DACIA'): VehicleModel[] {
  return VEHICLE_MODELS.filter(m => m.brand === brand);
}

export function getCategoriesByBrand(brand: 'RENAULT' | 'DACIA'): string[] {
  const models = getModelsByBrand(brand);
  return [...new Set(models.map(m => m.category))];
}

export function getModelsByCategory(brand: 'RENAULT' | 'DACIA', category: string): VehicleModel[] {
  return VEHICLE_MODELS.filter(m => m.brand === brand && m.category === category);
}

export function getModelById(id: string): VehicleModel | undefined {
  return VEHICLE_MODELS.find(m => m.id === id);
}
