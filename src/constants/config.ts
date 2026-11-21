import { ParcelSizeOption, VehicleTierConfig } from '@/types/delivery';

export const APP_CONFIG = {
  appName: 'CarryGo',
  currencyCode: 'GHS',
  currencySymbol: 'GH₵',
  distanceUnit: 'km',
  countryBias: 'gh',
  defaultPhonePrefix: '+233',
  defaultRegion: {
    latitude: 5.6037,
    longitude: -0.187,
    latitudeDelta: 0.055,
    longitudeDelta: 0.045,
  },
};

export const VEHICLE_TIERS: Record<'bike' | 'car', VehicleTierConfig> = {
  bike: {
    id: 'bike',
    name: 'CarryGo Bike',
    tagline: 'Zippy dispatch through Accra traffic',
    capacityHint: 'Up to 15 kg · Backpack / Top-box',
    baseFare: 15,
    perKmRate: 4.5,
    minFare: 18,
    speedKmPerHour: 28,
    pickupEtaMins: 4,
  },
  car: {
    id: 'car',
    name: 'CarryGo Car',
    tagline: 'Weather-safe boot for fragile or multi-box parcels',
    capacityHint: 'Up to 60 kg · Sedan / Hatchback',
    baseFare: 28,
    perKmRate: 7.5,
    minFare: 35,
    speedKmPerHour: 24,
    pickupEtaMins: 6,
  },
};

export const PARCEL_SIZES: ParcelSizeOption[] = [
  {
    id: 'envelope',
    label: 'Envelope',
    subtitle: 'Docs, keys, phones',
    maxWeight: '< 1 kg',
    surcharge: 0,
    recommendedTier: 'bike',
  },
  {
    id: 'small_box',
    label: 'Small Box',
    subtitle: 'Shoebox, meals, gifts',
    maxWeight: '1–5 kg',
    surcharge: 0,
    recommendedTier: 'bike',
  },
  {
    id: 'medium_parcel',
    label: 'Medium Parcel',
    subtitle: 'Electronics, fashion bags',
    maxWeight: '5–15 kg',
    surcharge: 6,
    recommendedTier: 'bike',
  },
  {
    id: 'bulky_bag',
    label: 'Large / Multi-Box',
    subtitle: 'Groceries, crates, orders',
    maxWeight: '15–60 kg',
    surcharge: 12,
    recommendedTier: 'car',
  },
];

export const FRAGILE_HANDLING_FEE = 5;

export const PROMO_CODES: Record<
  string,
  { code: string; type: 'percent' | 'fixed'; value: number; description: string }
> = {
  CARRY10: {
    code: 'CARRY10',
    type: 'percent',
    value: 10,
    description: '10% off your CarryGo parcel delivery',
  },
  ACCRA5: {
    code: 'ACCRA5',
    type: 'fixed',
    value: 5,
    description: 'GH₵ 5.00 instant discount',
  },
  FREEDROP: {
    code: 'FREEDROP',
    type: 'fixed',
    value: 12,
    description: 'GH₵ 12.00 welcome courier credit',
  },
};

export const ACCRA_QUICK_PLACES = [
  {
    id: 'place-osu',
    label: 'Osu Oxford Street',
    addressLine: 'Oxford Street, Osu, Accra',
    latitude: 5.5567,
    longitude: -0.1818,
  },
  {
    id: 'place-airport',
    label: 'Airport City (Marina Mall)',
    addressLine: 'Airport Bypass Rd, Airport City, Accra',
    latitude: 5.5993,
    longitude: -0.1753,
  },
  {
    id: 'place-east-legon',
    label: 'East Legon (A&C Mall)',
    addressLine: 'Jungle Ave, East Legon, Accra',
    latitude: 5.6352,
    longitude: -0.1563,
  },
  {
    id: 'place-makola',
    label: 'Makola Market / Central',
    addressLine: 'Kojo Thompson Rd, Accra Central',
    latitude: 5.5476,
    longitude: -0.2063,
  },
  {
    id: 'place-cantonments',
    label: 'Cantonments',
    addressLine: 'Gamel Abdul Nasser Ave, Cantonments, Accra',
    latitude: 5.5742,
    longitude: -0.1731,
  },
  {
    id: 'place-labone',
    label: 'Labone Junction',
    addressLine: 'Ndebaninge Sithole Rd, Labone, Accra',
    latitude: 5.5656,
    longitude: -0.1684,
  },
  {
    id: 'place-spintex',
    label: 'Spintex Palace Mall',
    addressLine: 'Spintex Rd, Accra',
    latitude: 5.6331,
    longitude: -0.1197,
  },
  {
    id: 'place-dansoman',
    label: 'Dansoman Junction',
    addressLine: 'Dansoman High St, Accra',
    latitude: 5.5529,
    longitude: -0.2644,
  },
];

export const SIMULATED_DRIVERS = [
  {
    name: 'Kofi Boateng',
    phone: '+233 24 812 4401',
    rating: 4.94,
    bikeVehicle: 'Honda Ace 125 · Red/Black',
    bikePlate: 'M-24-GR 4182',
    carVehicle: 'Toyota Vitz · Graphite Silver',
    carPlate: 'GR 4821-24',
  },
  {
    name: 'Yaw Mensah',
    phone: '+233 55 309 7718',
    rating: 4.89,
    bikeVehicle: 'Bajaj Boxer 150 · Signal Orange',
    bikePlate: 'M-23-GR 9031',
    carVehicle: 'Suzuki Swift · Pearl White',
    carPlate: 'GW 1920-23',
  },
  {
    name: 'Abena Osei',
    phone: '+233 20 674 1192',
    rating: 4.97,
    bikeVehicle: 'Yamaha Crux Rev · Matte Charcoal',
    bikePlate: 'M-25-GR 2219',
    carVehicle: 'Hyundai i10 · Midnight Blue',
    carPlate: 'GE 7734-24',
  },
];
