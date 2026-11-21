import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useAppTheme } from '@/hooks/useAppTheme';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  inverse?: boolean;
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  inverse = false,
}: BrandLogoProps) {
  const { palette } = useAppTheme();
  const iconDim = size === 'sm' ? 30 : size === 'lg' ? 52 : 38;
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 30 : 22;
  const textColor = inverse ? '#FFFFFF' : palette.ink;

  return (
    <View style={styles.row}>
      <Svg width={iconDim} height={iconDim} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="14" fill={palette.brand} />
        <Path
          d="M12 31L20 24L12 17"
          stroke="#FFFFFF"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22 31L30 24L22 17"
          stroke="#111318"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="36" cy="24" r="4" fill="#FFFFFF" />
      </Svg>
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize, color: textColor }]}>
          Carry<Text style={{ color: palette.brand }}>Go</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.7,
  },
});
