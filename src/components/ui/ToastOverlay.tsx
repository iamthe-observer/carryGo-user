import { useRouter } from 'expo-router';
import { Bell, CheckCircle2, Navigation, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export function ToastOverlay() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette } = useAppTheme();
  const toast = useCarryGoStore((s) => s.toast);
  const dismissToast = useCarryGoStore((s) => s.dismissToast);

  if (!toast) return null;

  const accent =
    toast.tone === 'mint'
      ? palette.mint
      : toast.tone === 'amber'
        ? palette.amber
        : toast.tone === 'danger'
          ? palette.danger
          : palette.brand;

  const IconComp =
    toast.tone === 'mint'
      ? CheckCircle2
      : toast.orderId
        ? Navigation
        : Bell;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: Math.max(insets.top + 8, 16) }]}
    >
      <Pressable
        onPress={() => {
          const targetId = toast.orderId;
          dismissToast();
          if (targetId) {
            router.push(`/order/${targetId}`);
          }
        }}
        style={[
          styles.card,
          Shadows.floating,
          {
            backgroundColor: palette.ink,
            borderColor: accent,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: accent }]}>
          <IconComp size={18} color="#FFFFFF" />
        </View>
        <View style={styles.bodyWrap}>
          <Text style={[styles.title, { color: palette.inkInverse }]} numberOfLines={1}>
            {toast.title}
          </Text>
          <Text
            style={[styles.body, { color: palette.inkInverse }]}
            numberOfLines={2}
          >
            {toast.body}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <X size={16} color={palette.inkInverse} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 12.5,
    opacity: 0.85,
  },
  closeBtn: {
    padding: 4,
    opacity: 0.8,
  },
});
