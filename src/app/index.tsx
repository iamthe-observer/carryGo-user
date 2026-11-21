import { Redirect, useRouter } from 'expo-router';
import { ArrowRight, Bike, MapPin, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/services/notifications';
import { useCarryGoStore } from '@/store/useCarryGoStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    eyebrow: 'INSTANT PARCEL DISPATCH',
    title: 'Send packages across town in minutes.',
    subtitle:
      'Summon a CarryGo Bike or Car courier straight to your gate. Transparent GH₵ fares before you book.',
    icon: Bike,
    accentKey: 'brand' as const,
    stat: '4 min avg. pickup',
  },
  {
    id: '2',
    eyebrow: 'LIVE STREET TRACKING',
    title: 'Watch every turn from pickup to drop-off.',
    subtitle:
      'Follow your rider in real time on the map, message them in-app, and share live ETAs effortlessly.',
    icon: MapPin,
    accentKey: 'mint' as const,
    stat: 'Live GPS + Chat',
  },
  {
    id: '3',
    eyebrow: 'VERIFIED HANDOVER',
    title: 'Protected by a 4-digit Delivery PIN.',
    subtitle:
      'Your recipient confirms handover with a unique security code, plus instant digital Proof of Delivery.',
    icon: ShieldCheck,
    accentKey: 'ink' as const,
    stat: 'PIN + MoMo Ready',
  },
];

export default function OnboardingGate() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const hasHydrated = useCarryGoStore((s) => s._hasHydrated);
  const user = useCarryGoStore((s) => s.user);
  const hasCompletedOnboarding = useCarryGoStore((s) => s.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useCarryGoStore(
    (s) => s.setHasCompletedOnboarding
  );
  const loginDemo = useCarryGoStore((s) => s.loginDemo);

  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHydrationTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!hasHydrated && !hydrationTimedOut) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: palette.background,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          },
        ]}
      >
        <BrandLogo size="lg" />
        <ActivityIndicator color={palette.brand} size="small" />
      </SafeAreaView>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== activeIndex) {
      setActiveIndex(idx);
    }
  };

  const handleNext = () => {
    triggerHaptic('light');
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      setHasCompletedOnboarding(true);
      router.replace('/(auth)/login');
    }
  };

  const handleQuickDemo = () => {
    loginDemo();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topBar}>
        <BrandLogo size="md" />
        <Pressable
          onPress={() => {
            setHasCompletedOnboarding(true);
            router.replace('/(auth)/login');
          }}
          hitSlop={12}
        >
          <Text style={[styles.skipText, { color: palette.inkSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const IconComp = item.icon;
          const accent =
            item.accentKey === 'brand'
              ? palette.brand
              : item.accentKey === 'mint'
                ? palette.mint
                : palette.ink;
          const softBg =
            item.accentKey === 'brand'
              ? palette.brandSoft
              : item.accentKey === 'mint'
                ? palette.mintSoft
                : palette.surfaceAlt;

          return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View
                style={[
                  styles.heroBox,
                  { backgroundColor: softBg, borderColor: palette.border },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: accent }]}>
                  <IconComp size={42} color={item.accentKey === 'ink' ? palette.inkInverse : '#FFFFFF'} />
                </View>
                <View
                  style={[
                    styles.statChip,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                >
                  <Text style={[styles.statText, { color: palette.ink }]}>
                    {item.stat}
                  </Text>
                </View>
              </View>

              <View style={styles.copyWrap}>
                <Text style={[styles.eyebrow, { color: palette.brand }]}>
                  {item.eyebrow}
                </Text>
                <Text style={[styles.title, { color: palette.ink }]}>
                  {item.title}
                </Text>
                <Text style={[styles.subtitle, { color: palette.inkSecondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, idx) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                {
                  width: idx === activeIndex ? 26 : 8,
                  backgroundColor:
                    idx === activeIndex ? palette.brand : palette.borderStrong,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={
            activeIndex === SLIDES.length - 1 ? 'Continue to CarryGo' : 'Next'
          }
          variant="brand"
          onPress={handleNext}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />

        <Button
          title="Quick Start with Demo Account"
          variant="secondary"
          onPress={handleQuickDemo}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 28,
  },
  heroBox: {
    height: 240,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
  },
  copyWrap: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15.5,
    lineHeight: 23,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
