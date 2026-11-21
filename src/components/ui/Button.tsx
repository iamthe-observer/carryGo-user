import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'brand' | 'secondary' | 'outline' | 'danger';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const { palette } = useAppTheme();

  const bg =
    variant === 'brand'
      ? palette.brand
      : variant === 'secondary'
        ? palette.surfaceAlt
        : variant === 'outline'
          ? 'transparent'
          : variant === 'danger'
            ? palette.dangerSoft
            : palette.ink;

  const textColor =
    variant === 'brand'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? palette.ink
        : variant === 'outline'
          ? palette.ink
          : variant === 'danger'
            ? palette.danger
            : palette.inkInverse;

  const borderColor =
    variant === 'outline' ? palette.borderStrong : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'md' ? styles.md : styles.lg,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  md: {
    height: 44,
  },
  lg: {
    height: 54,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
