import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { formatCurrency } from '@/services/calculationService';
import { useInvoices } from '@/hooks/useInvoices';
import { useAlert } from '@/template';
import { generateAndSharePDF } from '@/services/pdfService';

export default function InvoiceDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { invoices } = useInvoices();
  const params = useLocalSearchParams<{ id?: string; data?: string }>();
  const [pdfLoading, setPdfLoading] = useState(false);

  const invoiceData = useMemo(() => {
    if (params.data) {
      try { return JSON.parse(params.data as string); } catch { return null; }
    }
    if (params.id) {
      const inv = invoices.find(i => i.id === params.id);
      if (inv) {
        try { return JSON.parse(inv.data); } catch { return null; }
      }
    }
    return null;
  }, [params.data, params.id, invoices]);

  if (!invoiceData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Facture introuvable</Text>
        </View>
      </View>
    );
  }

  const { state, breakdown: bd, ref } = invoiceData;
  const brand: 'RENAULT' | 'DACIA' = state.brand;
  const brandColor = brand === 'RENAULT' ? Colors.renault : Colors.dacia;
  const today = new Date().toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePDF = async () => {
    if (!invoiceData) return;
    setPdfLoading(true);
    try {
      await generateAndSharePDF(invoiceData);
    } catch (err) {
      showAlert('Erreur PDF', 'Impossible de générer le PDF. Veuillez réessayer.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const lines: string[] = [
      '══════════════════════════════',
      '      FACTURE PROFORMA',
      '══════════════════════════════',
      `REF: ${ref || 'N/A'}`,
      `DATE: ${today}`,
      '',
      `CLIENT: ${state.clientName || 'N/A'}`,
      `CIN/RC: ${state.clientRef || 'N/A'}`,
      `TYPE: ${state.clientType || 'N/A'}`,
      `NATURE: ${state.naturesDossier || 'N/A'}`,
      '',
      `VÉHICULE: ${state.model?.name}`,
      `MARQUE: ${brand}`,
      '',
      '── PRIX ──────────────────────',
      `Prix TTC: ${formatCurrency(bd.vehiclePriceTTC)}`,
    ];
    if (bd.paintPriceTTC > 0) lines.push(`Peinture métallisée: + ${formatCurrency(bd.paintPriceTTC)}`);
    if (bd.accessoriesTotalTTC > 0) lines.push(`Accessoires: + ${formatCurrency(bd.accessoriesTotalTTC)}`);
    if (bd.totalDiscountTTC > 0) lines.push(`Remise totale: - ${formatCurrency(bd.totalDiscountTTC)} (${bd.totalDiscountPercent.toFixed(2)}%)`);
    lines.push('');
    if (bd.tvaRate === 10) {
      lines.push(`Total HT 10%: ${formatCurrency(bd.totalHTTaux10)}`);
      lines.push(`TVA 10%: ${formatCurrency(bd.totalTVA10)}`);
    }
    lines.push(`Total HT 20%: ${formatCurrency(bd.totalHTTaux20)}`);
    lines.push(`TVA 20%: ${formatCurrency(bd.totalTVA20)}`);
    lines.push(`Prix TTC: ${formatCurrency(bd.prixTTCAvantFrais)}`);
    lines.push(`Frais d'enregistrement: + ${formatCurrency(bd.fraisEnregistrement)}`);
    lines.push('');
    lines.push(`★ NET À PAYER: ${formatCurrency(bd.netAPayer)} ★`);
    lines.push('');
    lines.push('ADKA AUTO — Tanger');
    lines.push('www.renault.ma | www.dacia.ma');

    try {
      await Share.share({ message: lines.join('\n'), title: `Facture Proforma ${ref}` });
    } catch {
      showAlert('Erreur', 'Impossible de partager la facture.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Facture Proforma</Text>
        <View style={styles.topBarActions}>
          <Pressable onPress={handleShare} style={styles.actionBtn}>
            <MaterialIcons name="share" size={20} color={brandColor} />
          </Pressable>
          <Pressable onPress={handlePDF} style={[styles.actionBtn, styles.pdfBtn, { backgroundColor: brandColor }]} disabled={pdfLoading}>
            {pdfLoading
              ? <ActivityIndicator size="small" color={Colors.textInverse} />
              : <MaterialIcons name="picture-as-pdf" size={20} color={Colors.textInverse} />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice header */}
        <View style={[styles.invoiceHeader, { borderTopColor: brandColor }]}>
          <View style={[styles.brandStrip, { backgroundColor: brandColor }]}>
            <Text style={styles.brandStripText}>FACTURE PROFORMA — {brand}</Text>
          </View>
          <View style={styles.invoiceMetaRow}>
            <View>
              <Text style={styles.metaLabel}>REF</Text>
              <Text style={styles.metaValue}>{ref || 'N/A'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{today}</Text>
            </View>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>CONSEILLER</Text>
            <Text style={styles.metaValue}>{state.conseiller || 'N/A'}</Text>
          </View>
        </View>

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEMANDEUR</Text>
          <View style={styles.infoGrid}>
            <InfoRow label="Nom / Raison Sociale" value={state.clientName || '—'} />
            <InfoRow label="CIN / RC" value={state.clientRef || '—'} />
            <InfoRow label="Type Client" value={state.clientType || '—'} />
            <InfoRow label="Nature Dossier" value={state.naturesDossier || '—'} />
            {state.chassisNumber ? <InfoRow label="N° Châssis" value={state.chassisNumber} /> : null}
          </View>
        </View>

        {/* Vehicle designation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉSIGNATION</Text>
          <View style={[styles.vehicleCard, { borderLeftColor: brandColor }]}>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>MARQUE</Text>
              <Text style={styles.vehicleValue}>{brand}</Text>
              <Text style={styles.vehicleQty}>QTE: 1</Text>
            </View>
            <Text style={styles.vehicleName}>{state.model?.name}</Text>
            <View style={styles.vehiclePriceRow}>
              <Text style={styles.vehiclePULabel}>P.U. HT</Text>
              <Text style={[styles.vehiclePU, { color: brandColor }]}>{formatCurrency(bd.vehiclePriceHT)}</Text>
            </View>
            <View style={styles.vehiclePriceRow}>
              <Text style={styles.vehiclePULabel}>P.U. TTC</Text>
              <Text style={[styles.vehiclePU, { color: brandColor }]}>{formatCurrency(bd.vehiclePriceTTC)}</Text>
            </View>
          </View>

          {/* Paint */}
          {bd.paintPriceTTC > 0 && (
            <View style={styles.lineItem}>
              <Text style={styles.lineItemName}>Peinture métallisée</Text>
              <View style={styles.lineItemAmounts}>
                <Text style={styles.lineItemHT}>{formatCurrency(bd.paintPriceHT)} HT</Text>
                <Text style={styles.lineItemTTC}>{formatCurrency(bd.paintPriceTTC)}</Text>
              </View>
            </View>
          )}

          {/* Accessories */}
          {state.accessories?.map((sa: any) => (
            <View key={sa.accessory.id} style={styles.lineItem}>
              <Text style={styles.lineItemName}>{sa.accessory.name} × {sa.quantity}</Text>
              <View style={styles.lineItemAmounts}>
                <Text style={styles.lineItemHT}>{formatCurrency(sa.accessory.priceHT * sa.quantity)} HT</Text>
                <Text style={styles.lineItemTTC}>{formatCurrency(sa.accessory.priceTTC * sa.quantity)}</Text>
              </View>
            </View>
          ))}

          {/* FMS */}
          <View style={styles.lineItem}>
            <Text style={styles.lineItemName}>Frais de mise en service</Text>
            <View style={styles.lineItemAmounts}>
              <Text style={styles.lineItemHT}>{formatCurrency(bd.fraisMiseEnServiceHT)} HT</Text>
              <Text style={styles.lineItemTTC}>{formatCurrency(bd.fraisMiseEnServiceTTC)}</Text>
            </View>
          </View>
        </View>

        {/* Remises */}
        {bd.totalDiscountTTC > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REMISES</Text>
            {bd.discountTTC > 0 && (
              <View style={styles.discountLine}>
                <Text style={styles.discountLabel}>Remise Client ({bd.discountPercent.toFixed(2)}%)</Text>
                <Text style={styles.discountValue}>- {formatCurrency(bd.discountTTC)}</Text>
              </View>
            )}
            {bd.flashTTC > 0 && (
              <View style={styles.discountLine}>
                <Text style={styles.discountLabel}>Flash Marketing ({bd.flashPercent.toFixed(2)}%)</Text>
                <Text style={styles.discountValue}>- {formatCurrency(bd.flashTTC)}</Text>
              </View>
            )}
            <View style={[styles.discountLine, styles.discountTotal]}>
              <Text style={styles.discountTotalLabel}>Remise Globale ({bd.totalDiscountPercent.toFixed(2)}%)</Text>
              <View>
                <Text style={styles.discountTotalTTC}>- {formatCurrency(bd.totalDiscountTTC)} TTC</Text>
                <Text style={styles.discountTotalHT}>- {formatCurrency(bd.totalDiscountHT)} HT</Text>
              </View>
            </View>
          </View>
        )}

        {/* Financial summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYNTHÈSE FINANCIÈRE</Text>
          <View style={styles.finSection}>
            {bd.tvaRate === 10 && (
              <>
                <FinRow label="Total HT Base taux 10%" value={formatCurrency(bd.totalHTTaux10)} />
                <FinRow label="Total TVA 10%" value={formatCurrency(bd.totalTVA10)} />
              </>
            )}
            <FinRow label="Total HT Base taux 20%" value={formatCurrency(bd.totalHTTaux20)} />
            <FinRow label="Total TVA 20%" value={formatCurrency(bd.totalTVA20)} />
            <View style={styles.finDivider} />
            <FinRow label="Prix TTC" value={formatCurrency(bd.prixTTCAvantFrais)} />
            <FinRow label="Frais d'enregistrement" value={formatCurrency(bd.fraisEnregistrement)} />
          </View>
        </View>

        {/* NET A PAYER */}
        <View style={[styles.netCard, { borderColor: brandColor }]}>
          <Text style={styles.netLabel}>NET À PAYER</Text>
          <Text style={[styles.netAmount, { color: brandColor }]}>{formatCurrency(bd.netAPayer)}</Text>
        </View>

        {/* Legal note */}
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            N.B: Nos prix sont donnés à titre indicatif, la facturation définitive sera établie au tarif en vigueur le jour de la livraison.
            Pour les véhicules particuliers, le règlement doit être effectué en TTC.
            Offre valable pour le mois en cours.
          </Text>
          <View style={styles.separator} />
          <Text style={styles.companyText}>
            ADKA AUTO – Siège social: Route de Tétouan Douar el Kharb, Propriété Nour – TANGER{'\n'}
            Internet: www.renault.ma, www.dacia.ma{'\n'}
            S.A.R.L au capital de 12.000.000 Dhs – R.C. 78175{'\n'}
            Patente: 57285023 – I.F.: 20689278 – ICE: 001727504000036
          </Text>
        </View>

        {/* Action */}
        <Pressable
          style={[styles.shareFullBtn, { backgroundColor: brandColor }]}
          onPress={handlePDF}
          disabled={pdfLoading}
        >
          {pdfLoading
            ? <ActivityIndicator size="small" color={Colors.textInverse} />
            : <MaterialIcons name="picture-as-pdf" size={20} color={Colors.textInverse} />}
          <Text style={[styles.shareFullBtnText, { color: Colors.textInverse }]}>
            {pdfLoading ? 'Génération PDF...' : 'Télécharger PDF'}
          </Text>
        </Pressable>
        <Pressable style={[styles.secondaryShareBtn, { borderColor: brandColor }]} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={brandColor} />
          <Text style={[styles.secondaryShareBtnText, { color: brandColor }]}>Partager (Texte)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={finStyles.row}>
      <Text style={finStyles.label}>{label}</Text>
      <Text style={finStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  label: { color: Colors.textMuted, fontSize: Typography.sizes.xs, flex: 1 },
  value: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500', flex: 1, textAlign: 'right' },
});

const finStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, flex: 1 },
  value: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  topBarTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  backText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, marginLeft: 4 },
  actionBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  pdfBtn: { borderRadius: Radius.full },
  shareFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: 16, marginBottom: Spacing.sm },
  shareFullBtnText: { fontSize: Typography.sizes.base, fontWeight: '700' },
  secondaryShareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: 13, borderWidth: 1 },
  secondaryShareBtnText: { fontSize: Typography.sizes.base, fontWeight: '600' },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  invoiceHeader: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.lg, borderTopWidth: 4 },
  brandStrip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  brandStripText: { color: Colors.textInverse, fontWeight: '800', fontSize: Typography.sizes.sm, letterSpacing: 1 },
  invoiceMetaRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  metaBlock: { padding: Spacing.lg, paddingTop: Spacing.sm },
  metaLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  metaValue: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  section: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.md },
  infoGrid: {},
  vehicleCard: { borderLeftWidth: 3, paddingLeft: Spacing.md, marginBottom: Spacing.sm },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vehicleLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', marginRight: Spacing.sm },
  vehicleValue: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '700', flex: 1 },
  vehicleQty: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  vehicleName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  vehiclePriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  vehiclePULabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  vehiclePU: { fontSize: Typography.sizes.base, fontWeight: '700' },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  lineItemName: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, flex: 1, marginRight: 8 },
  lineItemAmounts: { alignItems: 'flex-end' },
  lineItemHT: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  lineItemTTC: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  discountLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  discountLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, flex: 1 },
  discountValue: { color: Colors.success, fontSize: Typography.sizes.sm, fontWeight: '700' },
  discountTotal: { backgroundColor: Colors.successBg, borderRadius: Radius.sm, padding: Spacing.sm, borderBottomWidth: 0, marginTop: 4 },
  discountTotalLabel: { color: Colors.success, fontSize: Typography.sizes.sm, fontWeight: '700', flex: 1 },
  discountTotalTTC: { color: Colors.success, fontSize: Typography.sizes.base, fontWeight: '800', textAlign: 'right' },
  discountTotalHT: { color: Colors.success, fontSize: Typography.sizes.xs, textAlign: 'right' },
  finSection: { gap: 0 },
  finDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  netCard: { borderWidth: 2, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  netLabel: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.sm },
  netAmount: { fontSize: Typography.sizes.xxxl, fontWeight: '800' },
  legalBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  legalText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, lineHeight: 18, fontStyle: 'italic' },
  separator: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.md },
  companyText: { color: Colors.textMuted, fontSize: 10, lineHeight: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sizes.base },
});
