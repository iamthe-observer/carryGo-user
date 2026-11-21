import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Smartphone, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency } from '@/services/pricing';
import { useCarryGoStore } from '@/store/useCarryGoStore';

const PRESET_AMOUNTS = [20, 50, 100, 200];

export default function WalletScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const user = useCarryGoStore((s) => s.user);
  const topUpWallet = useCarryGoStore((s) => s.topUpWallet);

  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customInput, setCustomInput] = useState('');
  const [source, setSource] = useState('MTN MoMo');

  const finalAmount = customInput.trim()
    ? Math.max(0, parseFloat(customInput) || 0)
    : selectedAmount;

  const handleTopUp = () => {
    if (finalAmount <= 0) return;
    topUpWallet(finalAmount, source);
    setCustomInput('');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: palette.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <ArrowLeft size={19} color={palette.ink} />
        </Pressable>
        <Text style={[styles.title, { color: palette.ink }]}>
          CarryGo Wallet
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.balanceCard, Shadows.floating, { backgroundColor: palette.ink }]}>
          <View style={styles.balRow}>
            <Wallet size={20} color={palette.brand} />
            <Text style={styles.balLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balAmount}>
            {formatCurrency(user?.walletBalance ?? 0)}
          </Text>
          <Text style={styles.balSub}>
            Instant parcel checkout · No MoMo prompt wait at pickup
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            Top Up Amount (GH₵)
          </Text>
          <View style={styles.presetGrid}>
            {PRESET_AMOUNTS.map((amt) => {
              const active = !customInput.trim() && selectedAmount === amt;
              return (
                <Pressable
                  key={amt}
                  onPress={() => {
                    setCustomInput('');
                    setSelectedAmount(amt);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: active
                        ? palette.brandSoft
                        : palette.surfaceAlt,
                      borderColor: active ? palette.brand : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: active ? palette.brand : palette.ink },
                    ]}
                  >
                    {formatCurrency(amt)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="Or enter custom GH₵ amount..."
            placeholderTextColor={palette.inkMuted}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                backgroundColor: palette.surfaceAlt,
                color: palette.ink,
                borderColor: palette.border,
              },
            ]}
          />

          <Text style={[styles.sectionTitle, { color: palette.ink, marginTop: 6 }]}>
            Funding Source
          </Text>
          {['MTN MoMo', 'Telecel Cash', 'Visa •••• 4242'].map((src) => {
            const active = source === src;
            return (
              <Pressable
                key={src}
                onPress={() => setSource(src)}
                style={[
                  styles.srcRow,
                  {
                    backgroundColor: active
                      ? palette.brandSoft
                      : palette.surfaceAlt,
                    borderColor: active ? palette.brand : palette.border,
                  },
                ]}
              >
                <Smartphone
                  size={17}
                  color={active ? palette.brand : palette.ink}
                />
                <Text style={[styles.srcText, { color: palette.ink }]}>
                  {src}
                </Text>
              </Pressable>
            );
          })}

          <Button
            title={`Add ${formatCurrency(finalAmount)} to Wallet`}
            variant="brand"
            disabled={finalAmount <= 0}
            onPress={handleTopUp}
            icon={<Plus size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    borderRadius: Radius.xl,
    padding: 22,
    gap: 8,
  },
  balRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balLabel: {
    color: '#D1D5DB',
    fontSize: 13.5,
    fontWeight: '700',
  },
  balAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  balSub: {
    color: '#9CA3AF',
    fontSize: 12.5,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    width: '48.5%',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },
  srcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  srcText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
