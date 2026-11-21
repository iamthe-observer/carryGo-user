import { CheckCircle2, MapPin } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { Radius } from '@/constants/theme';

export type BootStage = 'hydrating' | 'locating' | 'ready';

interface LaunchSplashProps {
  stage: BootStage;
  visible: boolean;
  onFadeComplete: () => void;
}

const STAGE_COPY: Record<BootStage, string> = {
  hydrating: 'Loading your CarryGo workspace...',
  locating: 'Pinpointing your pickup location...',
  ready: 'Ready for dispatch',
};

export function LaunchSplash({
  stage,
  visible,
  onFadeComplete,
}: LaunchSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.14,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [logoScale, pulse]);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onFadeComplete();
        }
      });
    }
  }, [visible, opacity, onFadeComplete]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.overlay, { opacity }]}
    >
      {/* Subtle ambient background accents */}
      <Animated.View
        style={[
          styles.glowRingOuter,
          { transform: [{ scale: pulse }] },
        ]}
      />
      <View style={styles.glowRingInner} />

      {/* Center brand mark */}
      <Animated.View
        style={[styles.centerWrap, { transform: [{ scale: logoScale }] }]}
      >
        <BrandLogo size="lg" inverse />
        <Text style={styles.tagline}>
          Instant parcel rides · Across town in minutes
        </Text>
      </Animated.View>

      {/* Bottom live boot progress pill */}
      <View style={styles.footer}>
        <View style={styles.statusPill}>
          {stage === 'ready' ? (
            <CheckCircle2 size={16} color="#10B981" />
          ) : stage === 'locating' ? (
            <MapPin size={15} color="#FF5A1F" />
          ) : (
            <ActivityIndicator size="small" color="#FF5A1F" />
          )}
          <Text style={styles.statusText}>{STAGE_COPY[stage]}</Text>
        </View>
        <Text style={styles.versionTag}>GH₵ · Live GPS · PIN Protected</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 90, 31, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.16)',
  },
  glowRingInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  centerWrap: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  tagline: {
    color: '#A3AAB8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 52,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  statusText: {
    color: '#F5F6F8',
    fontSize: 13,
    fontWeight: '700',
  },
  versionTag: {
    color: '#6E7687',
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
