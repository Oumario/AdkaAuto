import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { TARIFF_VERSION, VEHICLE_MODELS } from '@/constants/tariff';
import { formatCurrency } from '@/services/calculationService';
import { parseTariffWorkbook, validateTariffResult, TariffImportResult, ScheduledTariff } from '@/services/tariffImportService';
import { useTariff } from '@/hooks/useTariff';
import { useAlert } from '@/template';

type AdminView = 'dashboard' | 'import' | 'preview' | 'scheduled';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const {
    activeTariff, scheduledTariffs, isUsingCustomTariff,
    scheduleNewTariff, removeTariff, activateNow, revertToEmbedded, refresh,
  } = useTariff();

  const [view, setView] = useState<AdminView>('dashboard');
  const [activeTab, setActiveTab] = useState<'DACIA' | 'RENAULT'>('DACIA');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Import flow state
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<TariffImportResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [tariffLabel, setTariffLabel] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [saving, setSaving] = useState(false);

  // ── PICK & PARSE FILE ────────────────────────────────────────────────────
  const handlePickFile = useCallback(async () => {
    setImporting(true);
    setParseResult(null);
    setValidationIssues([]);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setImporting(false);
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;

      // Read file as base64 then convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decode base64 to Uint8Array
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const parsed = parseTariffWorkbook(bytes.buffer);
      const issues = parsed.success ? validateTariffResult(parsed) : [];

      setParseResult(parsed);
      setValidationIssues(issues);

      // Pre-fill label from filename
      const fileName = asset.name?.replace(/\.xlsx?$/i, '') || 'Tarif';
      setTariffLabel(fileName);

      setView('preview');
    } catch (err: any) {
      showAlert('Erreur', `Impossible de lire le fichier: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setImporting(false);
    }
  }, [showAlert]);

  // ── CONFIRM & SCHEDULE ────────────────────────────────────────────────────
  const handleSchedule = useCallback(async (activateImmediately: boolean) => {
    if (!parseResult?.success) return;
    if (!tariffLabel.trim()) {
      showAlert('Champ requis', 'Veuillez saisir un nom pour ce tarif.');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(effectiveDate)) {
      showAlert('Date invalide', 'Format requis: YYYY-MM-DD (ex: 2025-07-01)');
      return;
    }

    setSaving(true);
    try {
      const tariff: ScheduledTariff = {
        id: Date.now().toString(),
        label: tariffLabel.trim(),
        effectiveDate,
        importedAt: new Date().toISOString(),
        renaultModels: parseResult.renaultModels,
        daciaModels: parseResult.daciaModels,
        totalModels: parseResult.totalModels,
        isActive: activateImmediately,
        sheetName: parseResult.sheetName,
      };

      await scheduleNewTariff(tariff);

      if (activateImmediately) {
        await activateNow(tariff.id);
      }

      showAlert(
        'Tarif enregistré',
        activateImmediately
          ? `"${tariff.label}" est maintenant actif avec ${tariff.totalModels} modèles.`
          : `"${tariff.label}" sera appliqué le ${effectiveDate}.`,
        [{ text: 'OK', onPress: () => setView('scheduled') }]
      );
    } catch (err: any) {
      showAlert('Erreur', `Impossible d'enregistrer le tarif: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  }, [parseResult, tariffLabel, effectiveDate, scheduleNewTariff, activateNow, showAlert]);

  const handleDelete = useCallback((id: string, label: string) => {
    showAlert(`Supprimer "${label}" ?`, 'Ce tarif sera définitivement supprimé.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeTariff(id) },
    ]);
  }, [removeTariff, showAlert]);

  const handleRevert = useCallback(() => {
    showAlert('Revenir au tarif intégré ?', 'Le tarif importé ne sera plus utilisé comme tarif actif.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: revertToEmbedded },
    ]);
  }, [revertToEmbedded, showAlert]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    const displayModels = isUsingCustomTariff && activeTariff
      ? [...activeTariff.renaultModels, ...activeTariff.daciaModels]
      : VEHICLE_MODELS;

    const dCount = displayModels.filter(m => m.brand === 'DACIA').length;
    const rCount = displayModels.filter(m => m.brand === 'RENAULT').length;

    const categoriesForBrand = (brand: 'RENAULT' | 'DACIA') => {
      const models = displayModels.filter(m => m.brand === brand);
      return [...new Set(models.map(m => m.category))];
    };

    const modelsForCategory = (brand: 'RENAULT' | 'DACIA', cat: string) =>
      displayModels.filter(m => m.brand === brand && m.category === cat);

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Administration</Text>
            <Text style={styles.headerSub}>Tarifs & Gestion</Text>
          </View>
          <Pressable style={styles.scheduledBtn} onPress={() => setView('scheduled')}>
            <MaterialIcons name="schedule" size={16} color={Colors.primary} />
            <Text style={styles.scheduledBtnText}>{scheduledTariffs.length} planifié(s)</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Active tariff banner */}
          <View style={[styles.activeTariffBanner, { borderColor: isUsingCustomTariff ? Colors.success : Colors.primary }]}>
            <View style={[styles.activeTariffDot, { backgroundColor: isUsingCustomTariff ? Colors.success : Colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTariffLabel}>
                {isUsingCustomTariff ? 'Tarif personnalisé actif' : 'Tarif intégré (défaut)'}
              </Text>
              <Text style={styles.activeTariffName}>
                {isUsingCustomTariff ? activeTariff?.label : TARIFF_VERSION.label}
              </Text>
              {isUsingCustomTariff && activeTariff && (
                <Text style={styles.activeTariffDate}>
                  Importé le {new Date(activeTariff.importedAt).toLocaleDateString('fr-MA')}
                </Text>
              )}
            </View>
            {isUsingCustomTariff && (
              <Pressable onPress={handleRevert} style={styles.revertBtn}>
                <MaterialIcons name="restore" size={16} color={Colors.textMuted} />
                <Text style={styles.revertBtnText}>Défaut</Text>
              </Pressable>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: Colors.renault }]}>
              <Text style={[styles.statNum, { color: Colors.renault }]}>{rCount}</Text>
              <Text style={styles.statLabel}>RENAULT</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.dacia }]}>
              <Text style={[styles.statNum, { color: Colors.dacia }]}>{dCount}</Text>
              <Text style={styles.statLabel}>DACIA</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.primary }]}>
              <Text style={[styles.statNum, { color: Colors.primary }]}>{rCount + dCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Import CTA */}
          <Pressable style={styles.importCard} onPress={() => setView('import')}>
            <View style={[styles.importIcon, { backgroundColor: Colors.primary }]}>
              <MaterialIcons name="upload-file" size={24} color={Colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.importCardTitle}>Importer un nouveau tarif</Text>
              <Text style={styles.importCardSub}>Fichier Excel (.xlsx) — Feuille "TARIF"</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
          </Pressable>

          {/* Brand tabs */}
          <View style={styles.tabRow}>
            {(['DACIA', 'RENAULT'] as const).map(b => (
              <Pressable
                key={b}
                style={[styles.tab, activeTab === b && { backgroundColor: b === 'RENAULT' ? Colors.renault : Colors.dacia }]}
                onPress={() => { setActiveTab(b); setExpandedCat(null); }}
              >
                <Text style={[styles.tabText, activeTab === b && { color: Colors.textInverse }]}>{b}</Text>
              </Pressable>
            ))}
          </View>

          {/* Models list */}
          <View style={styles.modelsSection}>
            {categoriesForBrand(activeTab).map(cat => {
              const models = modelsForCategory(activeTab, cat);
              const isExpanded = expandedCat === cat;
              const brandColor = activeTab === 'RENAULT' ? Colors.renault : Colors.dacia;
              return (
                <View key={cat} style={styles.catBlock}>
                  <Pressable
                    style={[styles.catHeader, isExpanded && { borderColor: brandColor }]}
                    onPress={() => setExpandedCat(isExpanded ? null : cat)}
                  >
                    <Text style={[styles.catName, isExpanded && { color: brandColor }]}>{cat}</Text>
                    <View style={styles.catMeta}>
                      <Text style={styles.catCount}>{models.length}</Text>
                      <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={20}
                        color={isExpanded ? brandColor : Colors.textMuted} />
                    </View>
                  </Pressable>
                  {isExpanded && models.map(m => (
                    <View key={m.id} style={styles.modelRow}>
                      <Text style={styles.modelName}>{m.name}</Text>
                      <View style={styles.modelMeta}>
                        <Text style={[styles.modelPrice, { color: brandColor }]}>{formatCurrency(m.priceTTC)}</Text>
                        <Text style={styles.modelHT}> — {formatCurrency(m.priceHT)} HT</Text>
                        <View style={styles.tvaBadge}>
                          <Text style={styles.tvaText}>TVA {m.tvaRate}%</Text>
                        </View>
                      </View>
                      {(m.discountParticulier != null || m.discountEntreprise != null) && (
                        <View style={styles.discountRow}>
                          {m.discountParticulier != null && (
                            <Text style={styles.discountTag}>Particulier: {(m.discountParticulier * 100).toFixed(1)}%</Text>
                          )}
                          {m.discountEntreprise != null && (
                            <Text style={styles.discountTag}>Entreprise: {(m.discountEntreprise * 100).toFixed(1)}%</Text>
                          )}
                          {m.discountLoueur != null && (
                            <Text style={styles.discountTag}>Loueur: {(m.discountLoueur * 100).toFixed(1)}%</Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: IMPORT SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'import') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setView('dashboard')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Importer un Tarif</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <View style={styles.infoBox}>
            <View style={styles.infoBoxHeader}>
              <MaterialIcons name="info" size={18} color={Colors.info} />
              <Text style={styles.infoBoxTitle}>Format requis</Text>
            </View>
            <Text style={styles.infoText}>Le fichier Excel doit contenir une feuille nommée <Text style={styles.bold}>"TARIF"</Text> avec les colonnes suivantes :</Text>
            <View style={styles.colTable}>
              {[
                ['A', 'Désignation (nom du modèle)'],
                ['B', 'Prix CLIENT HT'],
                ['C', 'Taux TVA (10 ou 20)'],
                ['E', 'Prix CLIENT TTC'],
                ['F', 'Frais immatriculation'],
                ['G', 'Frais transport TTC'],
                ['H', 'Prix vente public'],
                ['I', 'Peinture métallisée HT'],
                ['J', 'Frais mise en service HT'],
                ['L', 'Remise entreprise %'],
                ['N', 'Remise particulier %'],
                ['P', 'Remise loueur %'],
                ['R', 'Remise convention %'],
              ].map(([col, desc]) => (
                <View key={col} style={styles.colRow}>
                  <View style={styles.colBadge}><Text style={styles.colBadgeText}>{col}</Text></View>
                  <Text style={styles.colDesc}>{desc}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.infoNote}>
              Les lignes de catégories (sans prix) sont détectées automatiquement. La marque est identifiée par mots-clés dans les noms des modèles.
            </Text>
          </View>

          {/* Pick file button */}
          <Pressable
            style={[styles.pickBtn, importing && { opacity: 0.6 }]}
            onPress={handlePickFile}
            disabled={importing}
          >
            {importing
              ? <ActivityIndicator size="small" color={Colors.textInverse} />
              : <MaterialIcons name="folder-open" size={22} color={Colors.textInverse} />}
            <Text style={styles.pickBtnText}>
              {importing ? 'Lecture en cours...' : 'Sélectionner le fichier Excel'}
            </Text>
          </Pressable>

          <Text style={styles.supportedText}>Formats supportés: .xlsx, .xls</Text>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PREVIEW SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'preview' && parseResult) {
    const hasErrors = parseResult.errors.length > 0;
    const hasWarnings = parseResult.warnings.length > 0 || validationIssues.length > 0;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setView('import')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Aperçu du Tarif</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status banner */}
          <View style={[styles.statusBanner, {
            backgroundColor: hasErrors ? Colors.errorBg : Colors.successBg,
            borderColor: hasErrors ? Colors.error : Colors.success,
          }]}>
            <MaterialIcons
              name={hasErrors ? 'error' : 'check-circle'}
              size={22}
              color={hasErrors ? Colors.error : Colors.success}
            />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[styles.statusTitle, { color: hasErrors ? Colors.error : Colors.success }]}>
                {hasErrors ? 'Échec de l\'analyse' : `${parseResult.totalModels} modèles détectés`}
              </Text>
              <Text style={styles.statusSub}>
                Feuille: {parseResult.sheetName} &nbsp;|&nbsp;
                RENAULT: {parseResult.renaultModels.length} &nbsp;|&nbsp;
                DACIA: {parseResult.daciaModels.length}
              </Text>
            </View>
          </View>

          {/* Errors */}
          {hasErrors && (
            <View style={[styles.issueBox, { borderColor: Colors.error }]}>
              <Text style={[styles.issueTitle, { color: Colors.error }]}>Erreurs critiques</Text>
              {parseResult.errors.map((e, i) => (
                <View key={i} style={styles.issueRow}>
                  <MaterialIcons name="cancel" size={14} color={Colors.error} />
                  <Text style={styles.issueText}>{e}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Warnings */}
          {(hasWarnings || parseResult.warnings.length > 0) && (
            <View style={[styles.issueBox, { borderColor: Colors.warning }]}>
              <Text style={[styles.issueTitle, { color: Colors.warning }]}>
                Avertissements ({parseResult.warnings.length + validationIssues.length})
              </Text>
              {[...parseResult.warnings, ...validationIssues].map((w, i) => (
                <View key={i} style={styles.issueRow}>
                  <MaterialIcons name="warning" size={14} color={Colors.warning} />
                  <Text style={styles.issueText}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Config section — only if parse succeeded */}
          {!hasErrors && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuration</Text>

                <Text style={styles.inputLabel}>Nom du tarif</Text>
                <TextInput
                  style={styles.input}
                  value={tariffLabel}
                  onChangeText={setTariffLabel}
                  placeholder="Ex: Tarif Juillet 2025"
                  placeholderTextColor={Colors.textMuted}
                />

                <Text style={styles.inputLabel}>Date d'entrée en vigueur (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={effectiveDate}
                  onChangeText={setEffectiveDate}
                  placeholder="2025-07-01"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={styles.inputHint}>
                  Le tarif sera automatiquement appliqué à cette date au lancement de l'application.
                </Text>
              </View>

              {/* Preview models */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aperçu des modèles</Text>
                {(['RENAULT', 'DACIA'] as const).map(brand => {
                  const models = brand === 'RENAULT' ? parseResult.renaultModels : parseResult.daciaModels;
                  const color = brand === 'RENAULT' ? Colors.renault : Colors.dacia;
                  if (models.length === 0) return null;
                  return (
                    <View key={brand} style={styles.previewBrandBlock}>
                      <View style={[styles.previewBrandHeader, { backgroundColor: color }]}>
                        <Text style={styles.previewBrandTitle}>{brand} — {models.length} modèles</Text>
                      </View>
                      {models.slice(0, 5).map((m, i) => (
                        <View key={i} style={styles.previewModelRow}>
                          <Text style={styles.previewModelName} numberOfLines={1}>{m.name}</Text>
                          <Text style={[styles.previewModelPrice, { color }]}>{formatCurrency(m.priceTTC)}</Text>
                        </View>
                      ))}
                      {models.length > 5 && (
                        <Text style={styles.previewMore}>+{models.length - 5} autres modèles</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Action buttons */}
              <Pressable
                style={[styles.actionBtn, { backgroundColor: Colors.primary }, saving && { opacity: 0.6 }]}
                onPress={() => handleSchedule(false)}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <MaterialIcons name="schedule" size={20} color={Colors.textInverse} />}
                <Text style={styles.actionBtnText}>Planifier pour le {effectiveDate}</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: Colors.success }, saving && { opacity: 0.6 }]}
                onPress={() => handleSchedule(true)}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <MaterialIcons name="bolt" size={20} color={Colors.textInverse} />}
                <Text style={styles.actionBtnText}>Activer maintenant</Text>
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={() => setView('import')}>
                <Text style={styles.cancelBtnText}>Choisir un autre fichier</Text>
              </Pressable>
            </>
          )}

          {hasErrors && (
            <Pressable style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => setView('import')}>
              <MaterialIcons name="folder-open" size={20} color={Colors.textInverse} />
              <Text style={styles.actionBtnText}>Choisir un autre fichier</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: SCHEDULED TARIFFS LIST
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'scheduled') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setView('dashboard')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Tarifs Planifiés</Text>
          <Pressable onPress={() => setView('import')} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {scheduledTariffs.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="event-note" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun tarif planifié</Text>
              <Text style={styles.emptySub}>Importez un fichier Excel pour planifier un nouveau tarif.</Text>
              <Pressable style={[styles.actionBtn, { backgroundColor: Colors.primary, marginTop: Spacing.lg }]}
                onPress={() => setView('import')}>
                <MaterialIcons name="upload-file" size={18} color={Colors.textInverse} />
                <Text style={styles.actionBtnText}>Importer maintenant</Text>
              </Pressable>
            </View>
          ) : (
            scheduledTariffs.map(tariff => {
              const isEffective = new Date(tariff.effectiveDate) <= new Date();
              return (
                <View key={tariff.id} style={[styles.tariffCard, tariff.isActive && { borderColor: Colors.success, borderWidth: 2 }]}>
                  <View style={styles.tariffCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.tariffTitleRow}>
                        <Text style={styles.tariffLabel}>{tariff.label}</Text>
                        {tariff.isActive && (
                          <View style={styles.activeBadge}>
                            <MaterialIcons name="check-circle" size={12} color={Colors.success} />
                            <Text style={styles.activeBadgeText}>Actif</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tariffMeta}>
                        {tariff.totalModels} modèles (R:{tariff.renaultModels.length} / D:{tariff.daciaModels.length})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tariffInfoRow}>
                    <View style={styles.tariffInfoItem}>
                      <MaterialIcons name="event" size={14} color={Colors.textMuted} />
                      <Text style={styles.tariffInfoLabel}>Entrée en vigueur</Text>
                      <Text style={[styles.tariffInfoValue, isEffective && { color: Colors.success }]}>
                        {tariff.effectiveDate}
                        {isEffective ? ' ✓' : ' (futur)'}
                      </Text>
                    </View>
                    <View style={styles.tariffInfoItem}>
                      <MaterialIcons name="upload" size={14} color={Colors.textMuted} />
                      <Text style={styles.tariffInfoLabel}>Importé le</Text>
                      <Text style={styles.tariffInfoValue}>
                        {new Date(tariff.importedAt).toLocaleDateString('fr-MA')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tariffActions}>
                    {!tariff.isActive && (
                      <Pressable
                        style={[styles.tariffActionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => activateNow(tariff.id)}
                      >
                        <MaterialIcons name="bolt" size={15} color={Colors.textInverse} />
                        <Text style={styles.tariffActionText}>Activer</Text>
                      </Pressable>
                    )}
                    {tariff.isActive && (
                      <Pressable
                        style={[styles.tariffActionBtn, { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder }]}
                        onPress={handleRevert}
                      >
                        <MaterialIcons name="restore" size={15} color={Colors.textSecondary} />
                        <Text style={[styles.tariffActionText, { color: Colors.textSecondary }]}>Désactiver</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.tariffActionBtn, { backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.error }]}
                      onPress={() => handleDelete(tariff.id, tariff.label)}
                    >
                      <MaterialIcons name="delete-outline" size={15} color={Colors.error} />
                      <Text style={[styles.tariffActionText, { color: Colors.error }]}>Supprimer</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  headerSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  scheduledBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  scheduledBtnText: { color: Colors.primary, fontSize: Typography.sizes.xs, fontWeight: '700' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  topBarTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: Spacing.lg, paddingBottom: 40 },

  activeTariffBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.lg, marginBottom: 0,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1,
  },
  activeTariffDot: { width: 10, height: 10, borderRadius: 5 },
  activeTariffLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '600' },
  activeTariffName: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  activeTariffDate: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  revertBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: Radius.sm,
  },
  revertBtnText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1,
  },
  statNum: { fontSize: Typography.sizes.xl, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },

  importCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    margin: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed', ...Shadows.sm,
  },
  importIcon: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  importCardTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  importCardSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },

  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  tab: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  tabText: { color: Colors.textSecondary, fontWeight: '700', fontSize: Typography.sizes.sm },
  modelsSection: { marginHorizontal: Spacing.lg },
  catBlock: { marginBottom: Spacing.sm },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 2,
  },
  catName: { color: Colors.textPrimary, fontWeight: '600', fontSize: Typography.sizes.sm, flex: 1 },
  catMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catCount: {
    color: Colors.textMuted, fontSize: Typography.sizes.xs,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  modelRow: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: 2 },
  modelName: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: '500', marginBottom: 4 },
  modelMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  modelPrice: { fontSize: Typography.sizes.sm, fontWeight: '700' },
  modelHT: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  tvaBadge: { backgroundColor: Colors.infoBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  tvaText: { color: Colors.info, fontSize: Typography.sizes.xs, fontWeight: '600' },
  discountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  discountTag: {
    backgroundColor: Colors.successBg, color: Colors.success,
    fontSize: Typography.sizes.xs, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm, fontWeight: '600',
  },

  // Import screen
  infoBox: {
    backgroundColor: Colors.infoBg, borderRadius: Radius.md,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.info,
  },
  infoBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoBoxTitle: { color: Colors.info, fontSize: Typography.sizes.base, fontWeight: '700' },
  infoText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, lineHeight: 20, marginBottom: Spacing.md },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  colTable: { gap: 4, marginBottom: Spacing.sm },
  colRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  colBadge: {
    width: 22, height: 22, borderRadius: 4, backgroundColor: Colors.info,
    justifyContent: 'center', alignItems: 'center',
  },
  colBadgeText: { color: Colors.textInverse, fontSize: 10, fontWeight: '800' },
  colDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, flex: 1 },
  infoNote: {
    color: Colors.textMuted, fontSize: Typography.sizes.xs,
    fontStyle: 'italic', lineHeight: 18, marginTop: Spacing.sm,
  },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 18, marginBottom: Spacing.sm,
  },
  pickBtnText: { color: Colors.textInverse, fontSize: Typography.sizes.base, fontWeight: '700' },
  supportedText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },

  // Preview screen
  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, marginBottom: Spacing.md,
  },
  statusTitle: { fontSize: Typography.sizes.base, fontWeight: '700' },
  statusSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  issueBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.md,
  },
  issueTitle: { fontSize: Typography.sizes.sm, fontWeight: '700', marginBottom: Spacing.sm },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  issueText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, flex: 1, lineHeight: 18 },
  section: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700', marginBottom: Spacing.md },
  inputLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: 6, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: Typography.sizes.base,
  },
  inputHint: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 4, fontStyle: 'italic', lineHeight: 16 },
  previewBrandBlock: { marginBottom: Spacing.md, borderRadius: Radius.md, overflow: 'hidden' },
  previewBrandHeader: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  previewBrandTitle: { color: Colors.textInverse, fontWeight: '800', fontSize: Typography.sizes.sm },
  previewModelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  previewModelName: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, flex: 1, marginRight: 8 },
  previewModelPrice: { fontSize: Typography.sizes.xs, fontWeight: '700' },
  previewMore: {
    color: Colors.textMuted, fontSize: Typography.sizes.xs,
    textAlign: 'center', padding: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: 16, marginBottom: Spacing.sm,
  },
  actionBtnText: { color: Colors.textInverse, fontSize: Typography.sizes.base, fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.sm,
  },
  cancelBtnText: { color: Colors.textSecondary, fontSize: Typography.sizes.base, fontWeight: '600' },

  // Scheduled list
  tariffCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, ...Shadows.sm,
  },
  tariffCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  tariffTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  tariffLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  tariffMeta: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.successBg, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: Radius.full,
  },
  activeBadgeText: { color: Colors.success, fontSize: 10, fontWeight: '700' },
  tariffInfoRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  tariffInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  tariffInfoLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  tariffInfoValue: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  tariffActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  tariffActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  tariffActionText: { color: Colors.textInverse, fontSize: Typography.sizes.xs, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center', maxWidth: 260 },
});
