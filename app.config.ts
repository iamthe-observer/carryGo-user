import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CarryGo',
  slug: 'CarryGo',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'carrygo',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    ...config.ios,
    supportsTablet: false,
    bundleIdentifier: 'com.carrygo.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'CarryGo uses your location to auto-detect your parcel pickup point and show nearby couriers.',
    },
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      ? {
          config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        }
      : {}),
  },
  android: {
    ...config.android,
    package: 'com.carrygo.app',
    adaptiveIcon: {
      backgroundColor: '#111318',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    predictiveBackGestureEnabled: false,
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      ? {
          config: {
            googleMaps: {
              apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
          },
        }
      : {}),
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#111318',
        image: './assets/images/splash-icon.png',
        imageWidth: 84,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow CarryGo to access your location to set pickup points and track couriers.',
      },
    ],
    'expo-notifications',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
});
