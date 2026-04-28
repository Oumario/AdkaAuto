import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { VehicleModel } from '@/constants/tariff';
import { useTariff } from '@/hooks/useTariff';
import { ACCESSORIES, ACCESSORY_CATEGORIES, Accessory } from '@/constants/accessories';
import { useCalculator } from '@/hooks/useCalculator';
import { ClientType, formatCurrency } from '@/services/calculationService';
import { useInvoices } from '@/hooks/useInvoices';
import { generateRefNumber } from '@/services/storageService';

const CLIENT_TYPES: { key: ClientType; label: string; icon: string }[] = [
  { key: 'particulier', label: 'Particulier', icon: 'person' },
  { key: 'entreprise', label: 'Entreprise / Artisan', icon: 'business' },
  { key: 'loueur', label: 'Loueur', icon: 'car-rental' },
  { key: 'convention', label: 'Client Convention', icon: 'handshake' },
  { key: 'taxieur', label: 'Taxieur', icon: 'local-taxi' },
];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addInvoice } = useInvoices();
  const { state, setBrand, setModel, setClientType,
    setDiscountPercent, setFlashPercent, setPaint,
    addAccessory, removeAccessory, updateAccessoryQty,
    setClientInfo, computePrice, goToStep, reset,
  } = useCalculator();

  // Use dynamic tariff (auto-switches when a scheduled tariff becomes effective)
  const { getCategoriesByBrand, getModelsByCategory } = useTariff();


  const [accSearch, setAccSearch] = useState('');
  const [accCategory, setAccCategory] = useState('Tous');
  const [discountInput, setDiscountInput] = useState('');
  const [flashInput, setFlashInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const brandColor = state.brand === 'RENAULT' ? Colors.renault : Colors.dacia;
  const brandColorDark = state.brand === 'RENAULT' ? Colors.renaultDark : Colors.daciaDark;

  const handleSaveInvoice = async () => {
    if (!state.breakdown || !state.model || !state.brand) return;
    const ref = generateRefNumber(state.brand);
    await addInvoice({
      id: Date.now().toString(),
      refNumber: ref,
      date: new Date().toISOString(),
      clientName: state.clientName || 'Client',
      clientRef: state.clientRef || '',
      brand: state.brand,
      modelName: state.model.name,
      clientType: state.clientType || '',
      netAPayer: state.breakdown.netAPayer,
      discountTotal: state.breakdown.totalDiscountTTC,
      data: JSON.stringify({ state, breakdown: state.breakdown, ref }),
    });
    router.push('/invoice-detail');
  };

  const filteredAccessories = ACCESSORIES.filter(a => {
    const matchCat = accCategory === 'Tous' || a.category === accCategory;
    const matchSearch = a.name.toLowerCase().includes(accSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = getCategoriesByBrand(state.brand || 'RENAULT');
  const modelsForCategory = selectedCategory && state.brand
    ? getModelsByCategory(state.brand, selectedCategory)
    : [];

  const renderStepIndicator = () => {
    const steps = ['brand', 'model', 'client', 'options', 'summary'];
    const labels = ['Marque', 'Modèle', 'Client', 'Options', 'Résumé'];
    const current = steps.indexOf(state.step);
    return (
      <View style={styles.stepRow}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <Pressable
              onPress={() => i < current ? goToStep(s as any) : undefined}
              style={[styles.stepDot, i <= current && { backgroundColor: brandColor }]}
            >
              <Text style={[styles.stepDotText, i <= current && { color: Colors.textInverse }]}>
                {i < current ? '✓' : (i + 1).toString()}
              </Text>
            </Pressable>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, i < current && { backgroundColor: brandColor }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // ── STEP: BRAND ──────────────────────────────────────────────────────────
  if (state.step === 'brand') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.headerTitle}>ADKA AUTO</Text>
          <Text style={styles.headerSub}>Calculateur de Prix</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Choisir la Marque</Text>
          <View style={styles.brandRow}>
            <Pressable style={[styles.brandCard, { borderColor: Colors.renault }]}
              onPress={() => setBrand('RENAULT')}>
              <View style={[styles.brandBadge, { backgroundColor: Colors.renault }]}>
                <Text style={styles.brandBadgeText}>R</Text>
              </View>
              <Text style={[styles.brandName, { color: Colors.renault }]}>RENAULT</Text>
              <Text style={styles.brandSub}>Véhicules Renault</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.renault} />
            </Pressable>
            <Pressable style={[styles.brandCard, { borderColor: Colors.dacia }]}
              onPress={() => setBrand('DACIA')}>
              <View style={[styles.brandBadge, { backgroundColor: Colors.dacia }]}>
                <Text style={styles.brandBadgeText}>D</Text>
              </View>
              <Text style={[styles.brandName, { color: Colors.dacia }]}>DACIA</Text>
              <Text style={styles.brandSub}>Véhicules Dacia</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.dacia} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── STEP: MODEL ──────────────────────────────────────────────────────────
  if (state.step === 'model') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => goToStep('brand')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={[styles.brandPill, { backgroundColor: brandColor }]}>
            <Text style={styles.brandPillText}>{state.brand}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        {renderStepIndicator()}
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Choisir le Modèle</Text>
          {categories.map(cat => (
            <View key={cat} style={styles.categorySection}>
              <Pressable
                style={[styles.categoryHeader, selectedCategory === cat && { borderColor: brandColor }]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.categoryName, selectedCategory === cat && { color: brandColor }]}>{cat}</Text>
                <MaterialIcons
                  name={selectedCategory === cat ? 'expand-less' : 'expand-more'}
                  size={22}
                  color={selectedCategory === cat ? brandColor : Colors.textSecondary}
                />
              </Pressable>
              {selectedCategory === cat && modelsForCategory.map(m => (
                <Pressable
                  key={m.id}
                  style={[styles.modelItem, state.model?.id === m.id && { borderColor: brandColor, backgroundColor: `${brandColor}15` }]}
                  onPress={() => setModel(m)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modelName}>{m.name}</Text>
                    <View style={styles.modelPriceRow}>
                      <Text style={[styles.modelPrice, { color: brandColor }]}>{formatCurrency(m.priceTTC)}</Text>
                      <Text style={styles.modelTva}> TTC — TVA {m.tvaRate}%</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={brandColor} />
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── STEP: CLIENT ─────────────────────────────────────────────────────────
  if (state.step === 'client') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => goToStep('model')} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <View style={[styles.brandPill, { backgroundColor: brandColor }]}>
              <Text style={styles.brandPillText}>{state.brand}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          {renderStepIndicator()}
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Type de Client</Text>
            {CLIENT_TYPES.map(ct => (
              <Pressable
                key={ct.key}
                style={[styles.clientTypeCard, state.clientType === ct.key && { borderColor: brandColor, backgroundColor: `${brandColor}18` }]}
                onPress={() => setClientType(ct.key)}
              >
                <MaterialIcons name={ct.icon as any} size={24} color={state.clientType === ct.key ? brandColor : Colors.textSecondary} />
                <Text style={[styles.clientTypeLabel, state.clientType === ct.key && { color: brandColor }]}>{ct.label}</Text>
                {state.clientType === ct.key && <MaterialIcons name="check-circle" size={20} color={brandColor} style={{ marginLeft: 'auto' }} />}
              </Pressable>
            ))}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Informations Client</Text>
            <Text style={styles.inputLabel}>Nom Client / Raison Sociale</Text>
            <TextInput
              style={styles.input}
              value={state.clientName}
              onChangeText={v => setClientInfo({ clientName: v })}
              placeholder="Nom du client..."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>CIN / RC</Text>
            <TextInput
              style={styles.input}
              value={state.clientRef}
              onChangeText={v => setClientInfo({ clientRef: v })}
              placeholder="Numéro CIN ou RC..."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>Conseiller Commercial</Text>
            <TextInput
              style={styles.input}
              value={state.conseiller}
              onChangeText={v => setClientInfo({ conseiller: v })}
              placeholder="Nom du conseiller..."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>Nature du Dossier</Text>
            <View style={styles.pillRow}>
              {['comptant', 'crédit', 'leasing'].map(n => (
                <Pressable
                  key={n}
                  style={[styles.pill, state.naturesDossier === n && { backgroundColor: brandColor }]}
                  onPress={() => setClientInfo({ naturesDossier: n })}
                >
                  <Text style={[styles.pillText, state.naturesDossier === n && { color: Colors.textInverse }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>N° Châssis (si disponible)</Text>
            <TextInput
              style={styles.input}
              value={state.chassisNumber}
              onChangeText={v => setClientInfo({ chassisNumber: v })}
              placeholder="Numéro de châssis..."
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable
              style={[styles.nextBtn, { backgroundColor: state.clientType ? brandColor : Colors.surfaceBorder }]}
              onPress={() => state.clientType && goToStep('options')}
              disabled={!state.clientType}
            >
              <Text style={[styles.nextBtnText, { color: state.clientType ? Colors.textInverse : Colors.textMuted }]}>
                Continuer vers Options
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color={state.clientType ? Colors.textInverse : Colors.textMuted} />
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── STEP: OPTIONS ────────────────────────────────────────────────────────
  if (state.step === 'options') {
    const paintHT = state.model?.paintMetallicHT ?? 0;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => goToStep('client')} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.topBarTitle}>Options & Remises</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderStepIndicator()}
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Model summary */}
            <View style={[styles.modelSummaryCard, { borderLeftColor: brandColor }]}>
              <Text style={styles.modelSummaryName}>{state.model?.name}</Text>
              <Text style={[styles.modelSummaryPrice, { color: brandColor }]}>
                {formatCurrency(state.model?.priceTTC ?? 0)} TTC
              </Text>
            </View>

            {/* Suggested discount */}
            {state.breakdown?.suggestedDiscount != null && state.breakdown.suggestedDiscount > 0 && (
              <View style={styles.suggestBanner}>
                <MaterialIcons name="lightbulb" size={16} color={Colors.warning} />
                <Text style={styles.suggestText}>
                  Remise conseillée pour ce profil: {(state.breakdown.suggestedDiscount * 100).toFixed(1)}%
                </Text>
              </View>
            )}

            {/* Remise client */}
            <Text style={styles.sectionTitle}>Remise Client (%)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={discountInput}
                onChangeText={v => {
                  setDiscountInput(v);
                  const n = parseFloat(v);
                  setDiscountPercent(isNaN(n) ? 0 : n);
                }}
                keyboardType="decimal-pad"
                placeholder="Ex: 2.4"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.inputSuffix}><Text style={styles.inputSuffixText}>%</Text></View>
            </View>

            {/* Flash marketing */}
            <Text style={styles.sectionTitle}>Flash Marketing (%)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={flashInput}
                onChangeText={v => {
                  setFlashInput(v);
                  const n = parseFloat(v);
                  setFlashPercent(isNaN(n) ? 0 : n);
                }}
                keyboardType="decimal-pad"
                placeholder="Ex: 2"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.inputSuffix}><Text style={styles.inputSuffixText}>%</Text></View>
            </View>

            {/* Paint */}
            <Text style={styles.sectionTitle}>Peinture</Text>
            <View style={styles.paintRow}>
              <Pressable
                style={[styles.paintOption, !state.paint.isMetallic && { borderColor: brandColor, backgroundColor: `${brandColor}15` }]}
                onPress={() => setPaint({ isMetallic: false, priceHT: 0, priceTTC: 0 })}
              >
                <MaterialIcons name="format-color-fill" size={22} color={!state.paint.isMetallic ? brandColor : Colors.textSecondary} />
                <Text style={[styles.paintLabel, !state.paint.isMetallic && { color: brandColor }]}>Non Métallisée</Text>
                <Text style={styles.paintPrice}>0 Dhs</Text>
              </Pressable>
              <Pressable
                style={[styles.paintOption, state.paint.isMetallic && { borderColor: brandColor, backgroundColor: `${brandColor}15` }]}
                onPress={() => setPaint({ isMetallic: true, priceHT: paintHT, priceTTC: paintHT * 1.2 })}
              >
                <MaterialIcons name="auto-awesome" size={22} color={state.paint.isMetallic ? brandColor : Colors.textSecondary} />
                <Text style={[styles.paintLabel, state.paint.isMetallic && { color: brandColor }]}>Métallisée</Text>
                <Text style={styles.paintPrice}>+{formatCurrency(paintHT * 1.2)}</Text>
              </Pressable>
            </View>

            {/* Accessories */}
            <Text style={styles.sectionTitle}>Accessoires</Text>
            <TextInput
              style={styles.input}
              value={accSearch}
              onChangeText={setAccSearch}
              placeholder="Rechercher un accessoire..."
              placeholderTextColor={Colors.textMuted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}>
              {['Tous', ...ACCESSORY_CATEGORIES].map(c => (
                <Pressable
                  key={c}
                  style={[styles.catChip, accCategory === c && { backgroundColor: brandColor }]}
                  onPress={() => setAccCategory(c)}
                >
                  <Text style={[styles.catChipText, accCategory === c && { color: Colors.textInverse }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {filteredAccessories.map(acc => {
              const selected = state.accessories.find(a => a.accessory.id === acc.id);
              return (
                <View key={acc.id} style={[styles.accItem, selected && { borderColor: brandColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accName}>{acc.name}</Text>
                    <Text style={[styles.accPrice, { color: brandColor }]}>{formatCurrency(acc.priceTTC)}</Text>
                  </View>
                  {selected ? (
                    <View style={styles.qtyRow}>
                      <Pressable style={styles.qtyBtn} onPress={() => updateAccessoryQty(acc.id, selected.quantity - 1)}>
                        <MaterialIcons name="remove" size={18} color={Colors.textPrimary} />
                      </Pressable>
                      <Text style={styles.qtyText}>{selected.quantity}</Text>
                      <Pressable style={styles.qtyBtn} onPress={() => updateAccessoryQty(acc.id, selected.quantity + 1)}>
                        <MaterialIcons name="add" size={18} color={Colors.textPrimary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={[styles.addAccBtn, { borderColor: brandColor }]} onPress={() => addAccessory(acc)}>
                      <MaterialIcons name="add" size={18} color={brandColor} />
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Selected accessories summary */}
            {state.accessories.length > 0 && (
              <View style={styles.selAccBox}>
                <Text style={styles.selAccTitle}>Accessoires sélectionnés ({state.accessories.length})</Text>
                {state.accessories.map(sa => (
                  <View key={sa.accessory.id} style={styles.selAccRow}>
                    <Text style={styles.selAccName}>{sa.accessory.name} × {sa.quantity}</Text>
                    <Text style={styles.selAccPrice}>{formatCurrency(sa.accessory.priceTTC * sa.quantity)}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={[styles.nextBtn, { backgroundColor: brandColor }]} onPress={computePrice}>
              <MaterialIcons name="calculate" size={20} color={Colors.textInverse} />
              <Text style={[styles.nextBtnText, { color: Colors.textInverse }]}>Calculer le Prix</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── STEP: SUMMARY ────────────────────────────────────────────────────────
  if (state.step === 'summary' && state.breakdown) {
    const bd = state.breakdown;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => goToStep('options')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Résumé des Prix</Text>
          <Pressable onPress={reset} style={styles.resetBtn}>
            <MaterialIcons name="refresh" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>
        {renderStepIndicator()}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Net total hero */}
          <View style={[styles.heroCard, { borderColor: brandColor }]}>
            <Text style={styles.heroLabel}>NET À PAYER</Text>
            <Text style={[styles.heroAmount, { color: brandColor }]}>{formatCurrency(bd.netAPayer)}</Text>
            <Text style={styles.heroSub}>{state.model?.name}</Text>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: `${brandColor}20` }]}>
                <Text style={[styles.heroBadgeText, { color: brandColor }]}>{state.brand}</Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: `${brandColor}20` }]}>
                <Text style={[styles.heroBadgeText, { color: brandColor }]}>{state.clientType}</Text>
              </View>
            </View>
          </View>

          {/* Price breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Détail du Prix</Text>
            <Row label="Prix tarif TTC" value={formatCurrency(bd.vehiclePriceTTC)} />
            <Row label={`Prix tarif HT (TVA ${bd.tvaRate}%)`} value={formatCurrency(bd.vehiclePriceHT)} muted />
            {bd.paintPriceTTC > 0 && <Row label="Peinture métallisée" value={`+ ${formatCurrency(bd.paintPriceTTC)}`} />}
            {bd.accessoriesTotalTTC > 0 && <Row label="Accessoires" value={`+ ${formatCurrency(bd.accessoriesTotalTTC)}`} />}
            <View style={styles.divider} />
            {bd.discountTTC > 0 && (
              <Row label={`Remise client (${bd.discountPercent.toFixed(2)}%)`} value={`- ${formatCurrency(bd.discountTTC)}`} color={Colors.success} />
            )}
            {bd.flashTTC > 0 && (
              <Row label={`Flash Marketing (${bd.flashPercent.toFixed(2)}%)`} value={`- ${formatCurrency(bd.flashTTC)}`} color={Colors.warning} />
            )}
            {bd.totalDiscountTTC > 0 && (
              <Row label="Remise totale TTC" value={`- ${formatCurrency(bd.totalDiscountTTC)}`} color={Colors.success} bold />
            )}
            {bd.totalDiscountHT > 0 && (
              <Row label="Remise totale HT" value={`- ${formatCurrency(bd.totalDiscountHT)}`} muted />
            )}
            <View style={styles.divider} />
            {bd.tvaRate === 10 && (
              <>
                <Row label="Total HT base 10%" value={formatCurrency(bd.totalHTTaux10)} muted />
                <Row label="TVA 10%" value={formatCurrency(bd.totalTVA10)} muted />
              </>
            )}
            <Row label="Total HT base 20%" value={formatCurrency(bd.totalHTTaux20)} muted />
            <Row label="TVA 20%" value={formatCurrency(bd.totalTVA20)} muted />
            <View style={styles.divider} />
            <Row label="Prix TTC (avant frais)" value={formatCurrency(bd.prixTTCAvantFrais)} />
            <Row label="Frais d'enregistrement" value={`+ ${formatCurrency(bd.fraisEnregistrement)}`} />
            <View style={[styles.divider, { borderColor: brandColor }]} />
            <Row label="NET À PAYER" value={formatCurrency(bd.netAPayer)} bold color={brandColor} />
          </View>

          {/* Savings summary */}
          {bd.totalDiscountTTC > 0 && (
            <View style={[styles.savingsCard, { borderColor: Colors.success }]}>
              <MaterialIcons name="savings" size={24} color={Colors.success} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.savingsTitle}>Économie réalisée</Text>
                <Text style={[styles.savingsAmount, { color: Colors.success }]}>
                  {formatCurrency(bd.totalDiscountTTC)} TTC
                </Text>
                <Text style={styles.savingsSub}>
                  Soit {bd.totalDiscountPercent.toFixed(2)}% de remise globale
                </Text>
              </View>
            </View>
          )}

          {/* Prix public */}
          <View style={styles.publicCard}>
            <Text style={styles.publicLabel}>Prix de vente public</Text>
            <Text style={styles.publicPrice}>{formatCurrency(bd.pricePublic)}</Text>
          </View>

          {/* Action buttons */}
          <Pressable style={[styles.nextBtn, { backgroundColor: brandColor }]} onPress={handleSaveInvoice}>
            <MaterialIcons name="receipt" size={20} color={Colors.textInverse} />
            <Text style={[styles.nextBtnText, { color: Colors.textInverse }]}>Générer la Facture Proforma</Text>
          </Pressable>
          <Pressable style={[styles.secondaryBtn]} onPress={reset}>
            <MaterialIcons name="add" size={20} color={brandColor} />
            <Text style={[styles.secondaryBtnText, { color: brandColor }]}>Nouveau Calcul</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return null;
}

function Row({ label, value, muted, color, bold }: {
  label: string; value: string; muted?: boolean; color?: string; bold?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, muted && rowStyles.muted]}>{label}</Text>
      <Text style={[rowStyles.value, muted && rowStyles.muted, bold && rowStyles.bold, color ? { color } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, flex: 1, marginRight: 8 },
  value: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  muted: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  bold: { fontWeight: '700', fontSize: Typography.sizes.base },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg },
  logo: { width: 64, height: 64, borderRadius: Radius.md, marginBottom: Spacing.sm },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, fontWeight: '800', letterSpacing: 2 },
  headerSub: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginTop: 2 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  topBarTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  backBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  resetBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  brandPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  brandPillText: { color: Colors.textInverse, fontSize: Typography.sizes.sm, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceBorder, justifyContent: 'center', alignItems: 'center' },
  stepDotText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceBorder, marginHorizontal: 2 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.lg },
  brandRow: { flexDirection: 'row', gap: Spacing.md },
  brandCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 2, gap: Spacing.sm, ...Shadows.card },
  brandBadge: { width: 52, height: 52, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  brandBadgeText: { color: Colors.textInverse, fontSize: Typography.sizes.xl, fontWeight: '800' },
  brandName: { fontSize: Typography.sizes.lg, fontWeight: '800' },
  brandSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },
  categorySection: { marginBottom: Spacing.sm },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 4 },
  categoryName: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '600', flex: 1 },
  modelItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  modelName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: 4 },
  modelPriceRow: { flexDirection: 'row', alignItems: 'center' },
  modelPrice: { fontSize: Typography.sizes.base, fontWeight: '700' },
  modelTva: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  clientTypeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  clientTypeLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '500' },
  inputLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: 6, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, color: Colors.textPrimary, fontSize: Typography.sizes.base },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputSuffix: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  inputSuffixText: { color: Colors.textSecondary, fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
  pillText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  paintRow: { flexDirection: 'row', gap: Spacing.md },
  paintOption: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 4 },
  paintLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600', textAlign: 'center' },
  paintPrice: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  catScroll: { marginVertical: Spacing.sm },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '500' },
  accItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  accName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: 2 },
  accPrice: { fontSize: Typography.sizes.sm, fontWeight: '700' },
  addAccBtn: { width: 36, height: 36, borderRadius: Radius.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: { width: 30, height: 30, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: Colors.textPrimary, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  selAccBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginVertical: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  selAccTitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  selAccRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  selAccName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm },
  selAccPrice: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  suggestBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  suggestText: { color: Colors.warning, fontSize: Typography.sizes.sm, flex: 1 },
  modelSummaryCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 4, marginBottom: Spacing.sm },
  modelSummaryName: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, marginBottom: 2 },
  modelSummaryPrice: { fontSize: Typography.sizes.lg, fontWeight: '700' },
  heroCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 2, marginBottom: Spacing.lg, ...Shadows.card },
  heroLabel: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  heroAmount: { fontSize: Typography.sizes.xxxl, fontWeight: '800', marginBottom: Spacing.sm },
  heroSub: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, textAlign: 'center', marginBottom: Spacing.md },
  heroBadgeRow: { flexDirection: 'row', gap: Spacing.sm },
  heroBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  heroBadgeText: { fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  breakdownCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  breakdownTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700', marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  savingsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1 },
  savingsTitle: { color: Colors.success, fontSize: Typography.sizes.sm, fontWeight: '600' },
  savingsAmount: { fontSize: Typography.sizes.lg, fontWeight: '800', marginVertical: 2 },
  savingsSub: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
  publicCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  publicLabel: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  publicPrice: { color: Colors.textSecondary, fontSize: Typography.sizes.base, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: 16, marginTop: Spacing.md },
  nextBtnText: { fontSize: Typography.sizes.base, fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: 14, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  secondaryBtnText: { fontSize: Typography.sizes.base, fontWeight: '600' },
});
