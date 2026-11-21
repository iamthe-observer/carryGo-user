import { useColorScheme } from 'react-native';

import { Palette, ThemePalette } from '@/constants/theme';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export function useAppTheme(): {
  scheme: 'light' | 'dark';
  isDark: boolean;
  palette: ThemePalette;
} {
  const systemScheme = useColorScheme();
  const pref = useCarryGoStore((s) => s.themePreference);

  const scheme: 'light' | 'dark' =
    pref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : pref;

  return {
    scheme,
    isDark: scheme === 'dark',
    palette: Palette[scheme],
  };
}
