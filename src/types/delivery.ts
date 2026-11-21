export type VehicleTier = 'bike' | 'car';

export type ParcelSize = 'envelope' | 'small_box' | 'medium_parcel' | 'bulky_bag';

export type OrderStatus =
  | 'searching'
  | 'assigned'
  | 'arriving_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type PaymentMethodType =
  | 'momo'
  | 'card'
  | 'wallet'
  | 'cash_pickup'
  | 'cash_delivery';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface LocationSelection {
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
}

export interface VehicleTierConfig {
  id: VehicleTier;
  name: string;
  tagline: string;
  capacityHint: string;
  baseFare: number;
  perKmRate: number;
  minFare: number;
  speedKmPerHour: number;
  pickupEtaMins: number;
}

export interface ParcelSizeOption {
  id: ParcelSize;
  label: string;
  subtitle: string;
  maxWeight: string;
  surcharge: number;
  recommendedTier: VehicleTier;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  walletBalance: number;
  isDemo: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  contactName?: string;
  contactPhone?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: string;
  label: string;
  maskedDetails: string;
  isDefault: boolean;
}

export interface FareQuote {
  distanceKm: number;
  etaMinutes: number;
  baseFare: number;
  distanceFare: number;
  handlingFee: number;
  discountAmount: number;
  totalFare: number;
  routeCoordinates: GeoPoint[];
  isRoadRoute: boolean;
}

export interface DriverInfo {
  name: string;
  phone: string;
  rating: number;
  vehicle: string;
  plate: string;
  coordinate: GeoPoint;
  heading: number;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderRole: 'user' | 'driver' | 'system';
  body: string;
  createdAt: string;
}

export interface DeliveryOrder {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  vehicleTier: VehicleTier;
  pickup: LocationSelection;
  dropoff: LocationSelection;
  distanceKm: number;
  etaMinutes: number;
  remainingKm: number;
  remainingEtaMinutes: number;
  routeCoordinates: GeoPoint[];
  parcelSize: ParcelSize;
  parcelDescription: string;
  isFragile: boolean;
  handlingNotes: string;
  recipientName: string;
  recipientPhone: string;
  deliveryPin: string;
  paymentMethodId: string;
  paymentMethodLabel: string;
  promoCode?: string;
  baseFare: number;
  distanceFare: number;
  handlingFee: number;
  discountAmount: number;
  totalFare: number;
  driver?: DriverInfo;
  proofOfDeliveryNote?: string;
  rating?: number;
  ratingComment?: string;
  tipAmount?: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  milestones: Partial<Record<OrderStatus, string>>;
}
