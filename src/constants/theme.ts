import { Platform } from 'react-native';

export const Palette = {
  light: {
    background: '#F7F6F2',
    surface: '#FFFFFF',
    surfaceAlt: '#EFECE5',
    surfaceElevated: '#FFFFFF',
    ink: '#111318',
    inkSecondary: '#525866',
    inkMuted: '#8A909E',
    inkInverse: '#FFFFFF',
    brand: '#FF5A1F',
    brandPressed: '#E44810',
    brandSoft: '#FFF0EA',
    mint: '#10B981',
    mintSoft: '#E6F9F2',
    amber: '#F59E0B',
    amberSoft: '#FEF5E3',
    danger: '#EF4444',
    dangerSoft: '#FEECEC',
    info: '#2563EB',
    infoSoft: '#EAF0FE',
    border: '#E4E1D8',
    borderStrong: '#D0CBC0',
    mapOverlay: 'rgba(255, 255, 255, 0.94)',
    tabBar: 'rgba(255, 255, 255, 0.96)',
  },
  dark: {
    background: '#0C0E12',
    surface: '#161920',
    surfaceAlt: '#1F242D',
    surfaceElevated: '#1C2029',
    ink: '#F5F6F8',
    inkSecondary: '#A3AAB8',
    inkMuted: '#6E7687',
    inkInverse: '#111318',
    brand: '#FF6B35',
    brandPressed: '#FF5314',
    brandSoft: '#2E1810',
    mint: '#34D399',
    mintSoft: '#0D2C22',
    amber: '#FBBF24',
    amberSoft: '#2D230B',
    danger: '#F87171',
    dangerSoft: '#2E1315',
    info: '#60A5FA',
    infoSoft: '#12213B',
    border: '#262B36',
    borderStrong: '#343B4A',
    mapOverlay: 'rgba(22, 25, 32, 0.94)',
    tabBar: 'rgba(22, 25, 32, 0.96)',
  },
} as const;

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  inkInverse: string;
  brand: string;
  brandPressed: string;
  brandSoft: string;
  mint: string;
  mintSoft: string;
  amber: string;
  amberSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  border: string;
  borderStrong: string;
  mapOverlay: string;
  tabBar: string;
};

// Backwards-compatible export for starter components if referenced
export const Colors = {
  light: {
    text: Palette.light.ink,
    background: Palette.light.background,
    backgroundElement: Palette.light.surfaceAlt,
    backgroundSelected: Palette.light.border,
    textSecondary: Palette.light.inkSecondary,
  },
  dark: {
    text: Palette.dark.ink,
    background: Palette.dark.background,
    backgroundElement: Palette.dark.surfaceAlt,
    backgroundSelected: Palette.dark.border,
    textSecondary: Palette.dark.inkSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#111318',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#111318',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 72 }) ?? 64;
export const MaxContentWidth = 800;

export const DarkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#171b24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a93a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#171b24' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#262d3d' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#333d52' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1218' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#182420' }],
  },
];
