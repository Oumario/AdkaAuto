import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/services/calculationService';
import { useAlert } from '@/template';

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { invoices, loading, refresh, removeInvoice, clearAll } = useInvoices();
  const { showAlert } = useAlert();

  useEffect(() => { refresh(); }, []);

  const handleDelete = (id: string) => {
    showAlert('Supprimer cette facture ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeInvoice(id) },
    ]);
  };

  const handleClearAll = () => {
    showAlert('Supprimer toutes les factures ?', 'Toutes les factures seront effacées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout supprimer', style: 'destructive', onPress: clearAll },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getBrandColor = (brand: string) => brand === 'RENAULT' ? Colors.renault : Colors.dacia;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Factures Proforma</Text>
        {invoices.length > 0 && (
          <Pressable onPress={handleClearAll} style={styles.clearBtn}>
            <MaterialIcons name="delete-sweep" size={20} color={Colors.error} />
          </Pressable>
        )}
      </View>

      {invoices.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucune facture</Text>
          <Text style={styles.emptySub}>Générez votre première facture depuis le calculateur.</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const color = getBrandColor(item.brand);
            return (
              <Pressable
                style={[styles.card, { borderLeftColor: color }]}
                onPress={() => router.push({ pathname: '/invoice-detail', params: { id: item.id, data: item.data } })}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.brandBadge, { backgroundColor: color }]}>
                    <Text style={styles.brandBadgeText}>{item.brand[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.refText}>{item.refNumber}</Text>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={20} color={Colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <Text style={styles.modelName} numberOfLines={1}>{item.modelName}</Text>
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.label}>Net à payer</Text>
                    <Text style={[styles.amount, { color }]}>{formatCurrency(item.netAPayer)}</Text>
                  </View>
                  {item.discountTotal > 0 && (
                    <View style={styles.discountBadge}>
                      <MaterialIcons name="savings" size={14} color={Colors.success} />
                      <Text style={styles.discountText}>- {formatCurrency(item.discountTotal)}</Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  clearBtn: { padding: Spacing.sm },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sizes.base, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderLeftWidth: 4, ...Shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  brandBadge: { width: 36, height: 36, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  brandBadgeText: { color: Colors.textInverse, fontWeight: '800', fontSize: Typography.sizes.sm },
  refText: { color: Colors.textPrimary, fontWeight: '700', fontSize: Typography.sizes.sm },
  dateText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  clientName: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: 2 },
  modelName: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, marginBottom: Spacing.md },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  amount: { fontSize: Typography.sizes.lg, fontWeight: '800' },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successBg, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  discountText: { color: Colors.success, fontSize: Typography.sizes.xs, fontWeight: '700' },
});
