import {
  APP_CONFIG,
  FRAGILE_HANDLING_FEE,
  PARCEL_SIZES,
  PROMO_CODES,
  VEHICLE_TIERS,
} from '@/constants/config';
import { FareQuote, GeoPoint, ParcelSize, VehicleTier } from '@/types/delivery';

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${APP_CONFIG.currencySymbol} ${safe.toFixed(2)}`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} ${APP_CONFIG.distanceUnit}`;
}

export function evaluatePromoCode(
  codeRaw: string | undefined,
  subtotal: number
): { valid: boolean; discount: number; description?: string; normalized?: string } {
  const normalized = (codeRaw ?? '').trim().toUpperCase();
  if (!normalized) {
    return { valid: false, discount: 0 };
  }
  const promo = PROMO_CODES[normalized];
  if (!promo) {
    return { valid: false, discount: 0 };
  }
  const rawDiscount =
    promo.type === 'percent' ? (subtotal * promo.value) / 100 : promo.value;
  const discount = Math.min(subtotal * 0.6, Math.round(rawDiscount * 100) / 100);
  return {
    valid: true,
    discount,
    description: promo.description,
    normalized,
  };
}

export function calculateFareQuote(params: {
  distanceKm: number;
  vehicleTier: VehicleTier;
  parcelSize: ParcelSize;
  isFragile: boolean;
  promoCode?: string;
  routeCoordinates: GeoPoint[];
  isRoadRoute: boolean;
  osrmDurationMins?: number;
}): FareQuote {
  const tier = VEHICLE_TIERS[params.vehicleTier];
  const sizeConfig =
    PARCEL_SIZES.find((p) => p.id === params.parcelSize) ?? PARCEL_SIZES[1];

  const roundedKm = Math.max(0.5, Math.round(params.distanceKm * 10) / 10);
  const baseFare = tier.baseFare;
  const distanceFare = Math.round(roundedKm * tier.perKmRate * 100) / 100;
  const handlingFee =
    sizeConfig.surcharge + (params.isFragile ? FRAGILE_HANDLING_FEE : 0);

  const rawSubtotal = Math.max(
    tier.minFare,
    baseFare + distanceFare + handlingFee
  );

  const promoResult = evaluatePromoCode(params.promoCode, rawSubtotal);
  const discountAmount = promoResult.valid ? promoResult.discount : 0;
  const totalFare = Math.max(
    tier.minFare * 0.7,
    Math.round((rawSubtotal - discountAmount) * 100) / 100
  );

  const travelMins =
    params.osrmDurationMins && params.vehicleTier === 'car'
      ? params.osrmDurationMins
      : Math.max(
          5,
          Math.round((roundedKm / tier.speedKmPerHour) * 60)
        );

  const etaMinutes = tier.pickupEtaMins + travelMins;

  return {
    distanceKm: roundedKm,
    etaMinutes,
    baseFare,
    distanceFare,
    handlingFee,
    discountAmount,
    totalFare,
    routeCoordinates: params.routeCoordinates,
    isRoadRoute: params.isRoadRoute,
  };
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CG-${suffix}`;
}

export function generateDeliveryPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
