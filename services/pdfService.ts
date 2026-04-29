import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PriceBreakdown } from './calculationService';

interface InvoiceData {
  state: {
    brand: 'RENAULT' | 'DACIA';
    model: { name: string };
    clientType: string;
    clientName: string;
    clientRef: string;
    conseiller: string;
    naturesDossier: string;
    chassisNumber: string;
    accessories: { accessory: { id: string; name: string; priceTTC: number; priceHT: number }; quantity: number }[];
    selectedOptions: { option: { id: string; name: string; code: string; priceHT: number; priceTTC: number }; quantity: number }[];
    paint: { isMetallic: boolean; priceHT: number; priceTTC: number };
  };
  breakdown: PriceBreakdown;
  ref: string;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' Dhs';
}

function fmtPct(n: number): string {
  return n.toFixed(2) + '%';
}

export async function generateAndSharePDF(invoiceData: InvoiceData): Promise<void> {
  const { state, breakdown: bd, ref } = invoiceData;
  const brand = state.brand;
  const brandColor = brand === 'RENAULT' ? '#C41E3A' : '#1F5FAD';
  const brandColorLight = brand === 'RENAULT' ? '#FFF0F0' : '#EEF4FF';
  const today = new Date().toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const vehicleOptionsRows = (state.selectedOptions || []).map(so => `
    <tr>
      <td class="td-left">${so.option.name}${so.option.code ? ` <span class="qty-badge">${so.option.code}</span>` : ''}</td>
      <td class="td-right">${so.option.priceHT > 0 ? fmt(so.option.priceHT) : '—'}</td>
      <td class="td-right">${so.option.priceTTC > 0 ? fmt(so.option.priceTTC) : 'Inclus'}</td>
    </tr>
  `).join('');

  const accessoriesRows = state.accessories.map(sa => `
    <tr>
      <td class="td-left">${sa.accessory.name} <span class="qty-badge">× ${sa.quantity}</span></td>
      <td class="td-right">${fmt(sa.accessory.priceHT * sa.quantity)}</td>
      <td class="td-right">${fmt(sa.accessory.priceTTC * sa.quantity)}</td>
    </tr>
  `).join('');

  const paintRow = bd.paintPriceTTC > 0 ? `
    <tr>
      <td class="td-left">Peinture métallisée</td>
      <td class="td-right">${fmt(bd.paintPriceHT)}</td>
      <td class="td-right">${fmt(bd.paintPriceTTC)}</td>
    </tr>
  ` : '';

  const fmsRow = `
    <tr>
      <td class="td-left">Frais de mise en service</td>
      <td class="td-right">${fmt(bd.fraisMiseEnServiceHT)}</td>
      <td class="td-right">${fmt(bd.fraisMiseEnServiceTTC)}</td>
    </tr>
  `;

  const discountClientRow = bd.discountTTC > 0 ? `
    <tr class="discount-row">
      <td class="td-left">Remise Client (${fmtPct(bd.discountPercent)})</td>
      <td class="td-right discount-val">- ${fmt(bd.discountHT)}</td>
      <td class="td-right discount-val">- ${fmt(bd.discountTTC)}</td>
    </tr>
  ` : '';

  const flashRow = bd.flashTTC > 0 ? `
    <tr class="discount-row">
      <td class="td-left">Flash Marketing (${fmtPct(bd.flashPercent)})</td>
      <td class="td-right discount-val">- ${fmt(bd.flashHT)}</td>
      <td class="td-right discount-val">- ${fmt(bd.flashTTC)}</td>
    </tr>
  ` : '';

  const totalDiscountRow = bd.totalDiscountTTC > 0 ? `
    <tr class="total-discount-row">
      <td class="td-left"><strong>Remise Globale (${fmtPct(bd.totalDiscountPercent)})</strong></td>
      <td class="td-right discount-val"><strong>- ${fmt(bd.totalDiscountHT)}</strong></td>
      <td class="td-right discount-val"><strong>- ${fmt(bd.totalDiscountTTC)}</strong></td>
    </tr>
  ` : '';

  const tva10Rows = bd.tvaRate === 10 ? `
    <tr class="finance-row">
      <td class="td-left">Total HT – Base taux 10%</td>
      <td colspan="2" class="td-right">${fmt(bd.totalHTTaux10)}</td>
    </tr>
    <tr class="finance-row">
      <td class="td-left">Total TVA 10%</td>
      <td colspan="2" class="td-right">${fmt(bd.totalTVA10)}</td>
    </tr>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Facture Proforma – ${ref}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 14mm 12mm 14mm;
    background: #fff;
    position: relative;
  }

  /* ── HEADER ───────────────────────────────── */
  .header-banner {
    background: ${brandColor};
    color: #fff;
    padding: 12px 20px;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 3px;
  }
  .header-doc-type {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    opacity: 0.9;
  }

  .header-sub {
    background: ${brandColorLight};
    border: 1px solid ${brandColor};
    border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .header-sub-item { }
  .header-sub-label {
    font-size: 9px;
    font-weight: 700;
    color: #777;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }
  .header-sub-value {
    font-size: 12px;
    font-weight: 700;
    color: #1a1a2e;
  }

  /* ── SECTION BOXES ──────────────────────────── */
  .section-title {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${brandColor};
    border-bottom: 2px solid ${brandColor};
    padding-bottom: 3px;
    margin-bottom: 8px;
    margin-top: 14px;
  }

  .info-box {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px 14px;
    background: #fafafa;
    margin-bottom: 10px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 20px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dotted #ddd;
    padding: 3px 0;
  }
  .info-label {
    font-size: 9px;
    color: #888;
    font-weight: 600;
    min-width: 100px;
  }
  .info-value {
    font-size: 10px;
    color: #1a1a2e;
    font-weight: 600;
    text-align: right;
  }

  /* ── DESIGNATION TABLE ──────────────────────── */
  .desig-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
  }
  .desig-table thead tr {
    background: ${brandColor};
    color: #fff;
  }
  .desig-table th {
    padding: 7px 10px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .desig-table th.th-right { text-align: right; }
  .desig-table td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
  .td-left { text-align: left; color: #1a1a2e; font-size: 10px; }
  .td-right { text-align: right; color: #1a1a2e; font-size: 10px; font-weight: 500; }
  .vehicle-name-td { font-weight: 700; font-size: 11px; color: ${brandColor}; }
  .qty-badge { background: #eee; border-radius: 3px; padding: 1px 5px; font-size: 9px; color: #555; }

  .desig-table tr:nth-child(even) { background: #f9f9f9; }
  .desig-table tr:hover { background: ${brandColorLight}; }

  /* ── DISCOUNT ROWS ──────────────────────────── */
  .discount-row td { background: #fff8f8; }
  .discount-val { color: #c0392b !important; font-weight: 700 !important; }
  .total-discount-row td { background: #fff0f0; }
  .finance-row td { background: #f8f8f8; }

  /* ── FINANCIAL SUMMARY ──────────────────────── */
  .finance-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .finance-table td { padding: 5px 10px; }
  .finance-table tr { border-bottom: 1px solid #f0f0f0; }
  .finance-label { color: #555; font-size: 10px; }
  .finance-value { text-align: right; font-size: 10px; font-weight: 600; color: #1a1a2e; }
  .finance-divider td { border-top: 2px solid #ddd; padding-top: 6px; }

  /* ── NET A PAYER ────────────────────────────── */
  .net-box {
    background: ${brandColor};
    color: #fff;
    border-radius: 6px;
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 14px 0;
  }
  .net-label {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
  }
  .net-amount {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  /* ── SAVINGS ────────────────────────────────── */
  .savings-box {
    background: #f0fff4;
    border: 1px solid #27ae60;
    border-radius: 4px;
    padding: 8px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .savings-label { font-size: 10px; color: #27ae60; font-weight: 600; }
  .savings-amount { font-size: 14px; color: #27ae60; font-weight: 800; }

  /* ── LEGAL ──────────────────────────────────── */
  .legal-box {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px 14px;
    background: #fafafa;
    margin-top: 12px;
  }
  .legal-text {
    font-size: 8px;
    color: #888;
    font-style: italic;
    line-height: 1.7;
    margin-bottom: 6px;
  }
  .company-divider {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 8px 0;
  }
  .company-text {
    font-size: 8px;
    color: #aaa;
    line-height: 1.6;
    text-align: center;
  }

  /* ── SIGNATURE ──────────────────────────────── */
  .signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  .signature-box {
    width: 45%;
    border-top: 2px solid #e0e0e0;
    padding-top: 6px;
    text-align: center;
  }
  .signature-label { font-size: 9px; color: #888; font-weight: 600; }

  /* ── VALIDITY BADGE ─────────────────────────── */
  .validity-badge {
    display: inline-block;
    background: ${brandColorLight};
    border: 1px solid ${brandColor};
    border-radius: 3px;
    padding: 3px 10px;
    font-size: 9px;
    color: ${brandColor};
    font-weight: 700;
    margin-bottom: 6px;
  }
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER BANNER ── -->
  <div class="header-banner">
    <div class="header-brand">${brand}</div>
    <div class="header-doc-type">FACTURE PROFORMA</div>
  </div>

  <div class="header-sub">
    <div class="header-sub-item">
      <div class="header-sub-label">Référence</div>
      <div class="header-sub-value">${ref || 'N/A'}</div>
    </div>
    <div class="header-sub-item">
      <div class="header-sub-label">Date</div>
      <div class="header-sub-value">${today}</div>
    </div>
    <div class="header-sub-item">
      <div class="header-sub-label">Conseiller Commercial</div>
      <div class="header-sub-value">${state.conseiller || '—'}</div>
    </div>
    <div class="header-sub-item">
      <div class="header-sub-label">Nature Dossier</div>
      <div class="header-sub-value">${state.naturesDossier || '—'}</div>
    </div>
  </div>

  <!-- ── CLIENT INFO ── -->
  <div class="section-title">Demandeur</div>
  <div class="info-box">
    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Nom / Raison Sociale</span>
        <span class="info-value">${state.clientName || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">CIN / RC</span>
        <span class="info-value">${state.clientRef || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type Client</span>
        <span class="info-value">${state.clientType || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">N° Châssis</span>
        <span class="info-value">${state.chassisNumber || '—'}</span>
      </div>
    </div>
  </div>

  <!-- ── DESIGNATION ── -->
  <div class="section-title">Désignation</div>
  <table class="desig-table">
    <thead>
      <tr>
        <th style="width:55%">Désignation</th>
        <th class="th-right" style="width:22%">Prix Unitaire HT</th>
        <th class="th-right" style="width:23%">Montant TTC</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-left vehicle-name-td">${brand} – ${state.model?.name}</td>
        <td class="td-right">${fmt(bd.vehiclePriceHT)}</td>
        <td class="td-right">${fmt(bd.vehiclePriceTTC)}</td>
      </tr>
      ${vehicleOptionsRows}
      ${paintRow}
      ${accessoriesRows}
      ${fmsRow}
      ${discountClientRow}
      ${flashRow}
      ${totalDiscountRow}
    </tbody>
  </table>

  <!-- ── FINANCIAL SUMMARY ── -->
  <div class="section-title">Synthèse Financière</div>
  <table class="finance-table">
    <tbody>
      ${tva10Rows}
      <tr class="finance-row">
        <td class="finance-label">Total HT – Base taux 20%</td>
        <td class="finance-value">${fmt(bd.totalHTTaux20)}</td>
      </tr>
      <tr class="finance-row">
        <td class="finance-label">Total TVA 20%</td>
        <td class="finance-value">${fmt(bd.totalTVA20)}</td>
      </tr>
      <tr class="finance-divider">
        <td class="finance-label" style="font-weight:700;">Prix TTC</td>
        <td class="finance-value" style="font-size:12px;">${fmt(bd.prixTTCAvantFrais)}</td>
      </tr>
      <tr>
        <td class="finance-label">Frais d'enregistrement</td>
        <td class="finance-value">+ ${fmt(bd.fraisEnregistrement)}</td>
      </tr>
    </tbody>
  </table>

  <!-- ── NET A PAYER ── -->
  <div class="net-box">
    <div class="net-label">Net à Payer</div>
    <div class="net-amount">${fmt(bd.netAPayer)}</div>
  </div>

  ${bd.totalDiscountTTC > 0 ? `
  <!-- ── SAVINGS ── -->
  <div class="savings-box">
    <div class="savings-label">Économie réalisée — Remise globale de ${fmtPct(bd.totalDiscountPercent)}</div>
    <div class="savings-amount">- ${fmt(bd.totalDiscountTTC)} TTC</div>
  </div>
  ` : ''}

  <!-- ── VALIDITY ── -->
  <div style="text-align:center; margin-bottom: 6px;">
    <span class="validity-badge">Prix de vente public: ${fmt(bd.pricePublic)}</span>
  </div>

  <!-- ── LEGAL ── -->
  <div class="legal-box">
    <p class="legal-text">
      N.B: Nos prix sont donnés à titre indicatif, la facturation définitive sera établie au tarif en vigueur le jour de la livraison.
      Pour les véhicules particuliers, le règlement doit être effectué en TTC.
      Offre valable pour le mois en cours.
    </p>
    <hr class="company-divider"/>
    <p class="company-text">
      ADKA AUTO – Siège social: Route de Tétouan Douar el Kharb, Propriété Nour – TANGER &nbsp;|&nbsp;
      S.A.R.L au capital de 12.000.000 Dhs – R.C. 78175<br/>
      Internet: www.renault.ma &nbsp;|&nbsp; www.dacia.ma &nbsp;|&nbsp;
      Patente: 57285023 – I.F.: 20689278 – C.N.S.S.: 5165320 – ICE: 001727504000036
    </p>
  </div>

  <!-- ── SIGNATURES ── -->
  <div class="signature-row">
    <div class="signature-box">
      <div class="signature-label">Signature Conseiller Commercial</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Signature Chef de Ventes / Sites</div>
    </div>
  </div>

</div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Facture Proforma ${ref}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
