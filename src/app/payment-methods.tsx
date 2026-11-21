import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const paymentMethods = useCarryGoStore((s) => s.paymentMethods);
  const setDefaultPaymentMethod = useCarryGoStore(
    (s) => s.setDefaultPaymentMethod
  );
  const addPaymentMethod = useCarryGoStore((s) => s.addPaymentMethod);
  const removePaymentMethod = useCarryGoStore((s) => s.removePaymentMethod);

  const [modalOpen, setModalOpen] = useState(false);
  const [kind, setKind] = useState<'momo' | 'card'>('momo');
  const [provider, setProvider] = useState('Telecel Cash');
  const [number, setNumber] = useState('');

  const handleAdd = () => {
    const clean = number.trim();
    if (clean.length < 4) return;
    const masked =
      kind === 'momo'
        ? `${clean.slice(0, 3)} •••• ${clean.slice(-4)}`
        : `•••• ${clean.slice(-4)}`;
    addPaymentMethod({
      type: kind,
      provider: kind === 'momo' ? provider : 'Mastercard / Visa',
      label: kind === 'momo' ? provider : 'Debit / Credit Card',
      maskedDetails: masked,
    });
    setNumber('');
    setModalOpen(false);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <ArrowLeft size={19} color={palette.ink} />
        </Pressable>
        <Text style={[styles.title, { color: palette.ink, flex: 1 }]}>
          Payment Methods
        </Text>
        <Pressable
          onPress={() => setModalOpen(true)}
          style={[styles.addBtn, { backgroundColor: palette.brand }]}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {paymentMethods.map((pm) => {
          const isBuiltIn =
            pm.type === 'wallet' ||
            pm.type === 'cash_pickup' ||
            pm.type === 'cash_delivery';
          return (
            <Pressable
              key={pm.id}
              onPress={() => setDefaultPaymentMethod(pm.id)}
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: pm.isDefault ? palette.brand : palette.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: pm.isDefault
                      ? palette.brandSoft
                      : palette.surfaceAlt,
                  },
                ]}
              >
                {pm.type === 'wallet' ? (
                  <Wallet
                    size={18}
                    color={pm.isDefault ? palette.brand : palette.ink}
                  />
                ) : pm.type === 'momo' ? (
                  <Smartphone
                    size={18}
                    color={pm.isDefault ? palette.brand : palette.ink}
                  />
                ) : (
                  <CreditCard
                    size={18}
                    color={pm.isDefault ? palette.brand : palette.ink}
                  />
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.cardTitle, { color: palette.ink }]}>
                  {pm.label}
                </Text>
                <Text style={[styles.cardSub, { color: palette.inkSecondary }]}>
                  {pm.maskedDetails}
                </Text>
              </View>
              {pm.isDefault && <Check size={18} color={palette.brand} />}
              {!isBuiltIn && !pm.isDefault && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    removePaymentMethod(pm.id);
                  }}
                  hitSlop={10}
                >
                  <Trash2 size={17} color={palette.danger} />
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: palette.ink }]}>
              Add Payment Method
            </Text>

            <View style={styles.kindRow}>
              {(['momo', 'card'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  style={[
                    styles.kindChip,
                    {
                      backgroundColor:
                        kind === k ? palette.brandSoft : palette.surfaceAlt,
                      borderColor: kind === k ? palette.brand : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.kindText,
                      { color: kind === k ? palette.brand : palette.ink },
                    ]}
                  >
                    {k === 'momo' ? 'Mobile Money' : 'Debit / Credit Card'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {kind === 'momo' && (
              <TextInput
                value={provider}
                onChangeText={setProvider}
                placeholder="Network (MTN MoMo, Telecel Cash, AT Money)"
                placeholderTextColor={palette.inkMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceAlt,
                    color: palette.ink,
                    borderColor: palette.border,
                  },
                ]}
              />
            )}

            <TextInput
              value={number}
              onChangeText={setNumber}
              placeholder={
                kind === 'momo'
                  ? 'MoMo number (e.g. 024 123 4567)'
                  : 'Card number (last 4+ digits)'
              }
              placeholderTextColor={palette.inkMuted}
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  backgroundColor: palette.surfaceAlt,
                  color: palette.ink,
                  borderColor: palette.border,
                },
              ]}
            />

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Method"
                variant="brand"
                onPress={handleAdd}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  scroll: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardSub: { fontSize: 12.5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '800' },
  kindRow: { flexDirection: 'row', gap: 10 },
  kindChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  kindText: { fontSize: 13.5, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
