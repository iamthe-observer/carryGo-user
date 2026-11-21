import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, MapPin, Plus, Trash2 } from 'lucide-react-native';
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
import { searchPlaces } from '@/services/geo';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const savedAddresses = useCarryGoStore((s) => s.savedAddresses);
  const addSavedAddress = useCarryGoStore((s) => s.addSavedAddress);
  const removeSavedAddress = useCarryGoStore((s) => s.removeSavedAddress);
  const setDefaultAddress = useCarryGoStore((s) => s.setDefaultAddress);

  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim() || !addressQuery.trim()) return;
    setSaving(true);
    const matches = await searchPlaces(addressQuery.trim());
    const top = matches[0] ?? {
      label: label.trim(),
      addressLine: addressQuery.trim(),
      latitude: 5.6037,
      longitude: -0.187,
    };
    addSavedAddress({
      label: label.trim(),
      addressLine: top.addressLine || addressQuery.trim(),
      latitude: top.latitude,
      longitude: top.longitude,
      isDefault: savedAddresses.length === 0,
    });
    setSaving(false);
    setLabel('');
    setAddressQuery('');
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
          Saved Addresses
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
        {savedAddresses.map((addr) => (
          <View
            key={addr.id}
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View
              style={[styles.iconBox, { backgroundColor: palette.brandSoft }]}
            >
              <Bookmark size={18} color={palette.brand} />
            </View>
            <Pressable
              onPress={() => setDefaultAddress(addr.id)}
              style={{ flex: 1, gap: 3 }}
            >
              <View style={styles.labelRow}>
                <Text style={[styles.cardTitle, { color: palette.ink }]}>
                  {addr.label}
                </Text>
                {addr.isDefault && (
                  <View
                    style={[
                      styles.defaultBadge,
                      { backgroundColor: palette.mintSoft },
                    ]}
                  >
                    <Text
                      style={[styles.defaultText, { color: palette.mint }]}
                    >
                      Default
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardSub, { color: palette.inkSecondary }]}>
                {addr.addressLine}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => removeSavedAddress(addr.id)}
              hitSlop={10}
              style={{ padding: 6 }}
            >
              <Trash2 size={17} color={palette.danger} />
            </Pressable>
          </View>
        ))}
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
              Save a New Place
            </Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Label (e.g. Warehouse, Mom's House)"
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
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: palette.surfaceAlt,
                  borderColor: palette.border,
                },
              ]}
            >
              <MapPin size={16} color={palette.brand} />
              <TextInput
                value={addressQuery}
                onChangeText={setAddressQuery}
                placeholder="Area or street (e.g. East Legon, Accra)"
                placeholderTextColor={palette.inkMuted}
                style={[styles.innerInput, { color: palette.ink }]}
              />
            </View>
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Place"
                variant="brand"
                loading={saving}
                onPress={handleSave}
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
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  defaultText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13 },
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
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  innerInput: { flex: 1, fontSize: 14.5 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
