export interface Accessory {
  id: string;
  name: string;
  priceTTC: number;
  priceHT: number;
  category: string;
}

export const ACCESSORIES: Accessory[] = [
  // Multimedia
  { id: 'acc-001', name: 'MULTI VUE (caméra de recul)', priceTTC: 4000, priceHT: 3333.33, category: 'Multimédia' },
  { id: 'acc-002', name: 'GPS Portable', priceTTC: 1200, priceHT: 1000, category: 'Multimédia' },
  { id: 'acc-003', name: 'Support Téléphone', priceTTC: 240, priceHT: 200, category: 'Multimédia' },
  // Protection
  { id: 'acc-004', name: 'Tapis de sol caoutchouc', priceTTC: 600, priceHT: 500, category: 'Protection' },
  { id: 'acc-005', name: 'Tapis de sol moquette', priceTTC: 960, priceHT: 800, category: 'Protection' },
  { id: 'acc-006', name: 'Film de protection carrosserie', priceTTC: 2400, priceHT: 2000, category: 'Protection' },
  { id: 'acc-007', name: 'Protection de pare-chocs arrière', priceTTC: 720, priceHT: 600, category: 'Protection' },
  // Confort
  { id: 'acc-008', name: 'Sellerie cuir', priceTTC: 6000, priceHT: 5000, category: 'Confort' },
  { id: 'acc-009', name: 'Attelage avec faisceau', priceTTC: 3600, priceHT: 3000, category: 'Confort' },
  { id: 'acc-010', name: 'Barres de toit', priceTTC: 1800, priceHT: 1500, category: 'Confort' },
  { id: 'acc-011', name: 'Coffre de toit 400L', priceTTC: 3600, priceHT: 3000, category: 'Confort' },
  // Sécurité
  { id: 'acc-012', name: 'Alarme', priceTTC: 2400, priceHT: 2000, category: 'Sécurité' },
  { id: 'acc-013', name: 'Antivol mécanique', priceTTC: 600, priceHT: 500, category: 'Sécurité' },
  { id: 'acc-014', name: 'Extincteur homologué', priceTTC: 360, priceHT: 300, category: 'Sécurité' },
  // Extension garantie
  { id: 'acc-015', name: 'Extension de garantie 5 ans', priceTTC: 4800, priceHT: 4000, category: 'Garantie' },
  { id: 'acc-016', name: 'Contrat entretien 3 ans/45000km', priceTTC: 3600, priceHT: 3000, category: 'Garantie' },
  // Divers
  { id: 'acc-017', name: 'Vitres teintées', priceTTC: 1200, priceHT: 1000, category: 'Divers' },
  { id: 'acc-018', name: 'Becquet arrière', priceTTC: 1800, priceHT: 1500, category: 'Divers' },
  { id: 'acc-019', name: 'Jantes alliage 16"', priceTTC: 4800, priceHT: 4000, category: 'Divers' },
  { id: 'acc-020', name: 'Capot de toit panoramique', priceTTC: 6000, priceHT: 5000, category: 'Divers' },
];

export const ACCESSORY_CATEGORIES = [...new Set(ACCESSORIES.map(a => a.category))];
