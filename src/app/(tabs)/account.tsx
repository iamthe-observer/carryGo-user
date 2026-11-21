import { useRouter } from 'expo-router';
import {
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Shield,
  Sun,
  Wallet,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { formatCurrency } from '@/services/pricing';
import { ThemePreference, useCarryGoStore } from '@/store/useCarryGoStore';

export default function AccountScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  const user = useCarryGoStore((s) => s.user);
  const savedAddresses = useCarryGoStore((s) => s.savedAddresses);
  const paymentMethods = useCarryGoStore((s) => s.paymentMethods);
  const orders = useCarryGoStore((s) => s.orders);
  const themePreference = useCarryGoStore((s) => s.themePreference);
  const setThemePreference = useCarryGoStore((s) => s.setThemePreference);
  const logout = useCarryGoStore((s) => s.logout);

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const handleLogout = () => {
    Alert.alert('Sign out of CarryGo?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileCard,
            Shadows.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: palette.brand }]}>
            <Text style={styles.avatarInitials}>
              {(user?.fullName ?? 'CG')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: palette.ink }]}>
              {user?.fullName ?? 'CarryGo Sender'}
            </Text>
            <Text style={[styles.meta, { color: palette.inkSecondary }]}>
              {user?.email} · {user?.phone || '+233'}
            </Text>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.smallBadge,
                  {
                    backgroundColor: user?.isDemo
                      ? palette.amberSoft
                      : palette.mintSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.smallBadgeText,
                    { color: user?.isDemo ? palette.amber : palette.mint },
                  ]}
                >
                  {user?.isDemo
                    ? 'Demo Profile'
                    : isSupabaseConfigured
                      ? 'Supabase Synced'
                      : 'Local Profile'}
                </Text>
              </View>
              <View
                style={[
                  styles.smallBadge,
                  { backgroundColor: palette.surfaceAlt },
                ]}
              >
                <Text style={[styles.smallBadgeText, { color: palette.ink }]}>
                  {deliveredCount} Delivered
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wallet Card */}
        <Pressable
          onPress={() => router.push('/wallet')}
          style={[styles.walletHero, Shadows.floating, { backgroundColor: palette.ink }]}
        >
          <View style={styles.walletTop}>
            <View style={styles.walletLabelRow}>
              <Wallet size={18} color={palette.brand} />
              <Text style={styles.walletLabel}>CarryGo Wallet</Text>
            </View>
            <View style={[styles.topUpChip, { backgroundColor: palette.brand }]}>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.topUpText}>Top Up</Text>
            </View>
          </View>
          <Text style={styles.walletBalance}>
            {formatCurrency(user?.walletBalance ?? 0)}
          </Text>
          <Text style={styles.walletHint}>
            Instant parcel checkout & zero-friction rider tips
          </Text>
        </Pressable>

        {/* Quick Links */}
        <View
          style={[
            styles.menuCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Pressable
            onPress={() => router.push('/addresses')}
            style={styles.menuRow}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: palette.mintSoft }]}
            >
              <MapPin size={18} color={palette.mint} />
            </View>
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: palette.ink }]}>
                Saved Addresses
              </Text>
              <Text style={[styles.menuSub, { color: palette.inkSecondary }]}>
                {savedAddresses.length} saved places in Accra
              </Text>
            </View>
            <ChevronRight size={18} color={palette.inkMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <Pressable
            onPress={() => router.push('/payment-methods')}
            style={styles.menuRow}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: palette.brandSoft }]}
            >
              <CreditCard size={18} color={palette.brand} />
            </View>
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: palette.ink }]}>
                Payment Methods
              </Text>
              <Text style={[styles.menuSub, { color: palette.inkSecondary }]}>
                {paymentMethods.length} options (MTN MoMo, Wallet, Visa, Cash)
              </Text>
            </View>
            <ChevronRight size={18} color={palette.inkMuted} />
          </Pressable>
        </View>

        {/* Appearance Selector */}
        <View
          style={[
            styles.themeCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={styles.themeHeader}>
            <Sun size={18} color={palette.ink} />
            <Text style={[styles.menuTitle, { color: palette.ink }]}>
              Appearance
            </Text>
          </View>
          <View style={styles.themePills}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((mode) => {
              const active = themePreference === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemePreference(mode)}
                  style={[
                    styles.themePill,
                    {
                      backgroundColor: active
                        ? palette.ink
                        : palette.surfaceAlt,
                    },
                  ]}
                >
                  {mode === 'dark' ? (
                    <Moon
                      size={14}
                      color={active ? palette.inkInverse : palette.ink}
                    />
                  ) : mode === 'light' ? (
                    <Sun
                      size={14}
                      color={active ? palette.inkInverse : palette.ink}
                    />
                  ) : (
                    <Shield
                      size={14}
                      color={active ? palette.inkInverse : palette.ink}
                    />
                  )}
                  <Text
                    style={[
                      styles.themeText,
                      { color: active ? palette.inkInverse : palette.ink },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            { backgroundColor: palette.dangerSoft, borderColor: palette.dangerSoft },
          ]}
        >
          <LogOut size={18} color={palette.danger} />
          <Text style={[styles.logoutText, { color: palette.danger }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  smallBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  smallBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  walletHero: {
    borderRadius: Radius.xl,
    padding: 20,
    gap: 8,
  },
  walletTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLabel: {
    color: '#D1D5DB',
    fontSize: 13.5,
    fontWeight: '700',
  },
  topUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  topUpText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  walletBalance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  walletHint: {
    color: '#9CA3AF',
    fontSize: 12.5,
  },
  menuCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 12.5,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  themeCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePills: {
    flexDirection: 'row',
    gap: 8,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  themeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
