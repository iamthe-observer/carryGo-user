import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DeliveryOrder,
  OrderMessage,
  PaymentMethod,
  SavedAddress,
  UserProfile,
} from '@/types/delivery';

export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase keys are not configured.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithSupabase(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase keys are not configured.');
  }
  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        phone: params.phone.trim(),
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.auth.signOut();
}

export async function fetchSupabaseProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: userRes.user?.email ?? '',
    fullName: data.full_name ?? 'CarryGo Sender',
    phone: data.phone ?? '',
    walletBalance: Number(data.wallet_balance ?? 0),
    isDemo: false,
  };
}

export async function syncWalletBalanceToSupabase(userId: string, balance: number) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase
    .from('profiles')
    .update({ wallet_balance: balance, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function syncAddressToSupabase(userId: string, address: SavedAddress) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('saved_addresses').upsert({
    id: address.id,
    user_id: userId,
    label: address.label,
    address_line: address.addressLine,
    latitude: address.latitude,
    longitude: address.longitude,
    contact_name: address.contactName ?? null,
    contact_phone: address.contactPhone ?? null,
    is_default: address.isDefault,
  });
}

export async function deleteAddressFromSupabase(addressId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('saved_addresses').delete().eq('id', addressId);
}

export async function syncPaymentMethodToSupabase(userId: string, method: PaymentMethod) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('payment_methods').upsert({
    id: method.id,
    user_id: userId,
    type: method.type,
    provider: method.provider,
    label: method.label,
    masked_details: method.maskedDetails,
    is_default: method.isDefault,
  });
}

export async function syncOrderToSupabase(userId: string, order: DeliveryOrder) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('orders').upsert({
    id: order.id,
    tracking_code: order.trackingCode,
    user_id: userId,
    status: order.status,
    vehicle_tier: order.vehicleTier,
    pickup_address: order.pickup.addressLine,
    pickup_lat: order.pickup.latitude,
    pickup_lng: order.pickup.longitude,
    dropoff_address: order.dropoff.addressLine,
    dropoff_lat: order.dropoff.latitude,
    dropoff_lng: order.dropoff.longitude,
    distance_km: order.distanceKm,
    eta_minutes: order.etaMinutes,
    parcel_size: order.parcelSize,
    parcel_description: order.parcelDescription,
    is_fragile: order.isFragile,
    handling_notes: order.handlingNotes,
    recipient_name: order.recipientName,
    recipient_phone: order.recipientPhone,
    delivery_pin: order.deliveryPin,
    payment_method: order.paymentMethodLabel,
    promo_code: order.promoCode ?? null,
    base_fare: order.baseFare,
    distance_fare: order.distanceFare,
    handling_fee: order.handlingFee,
    discount_amount: order.discountAmount,
    total_fare: order.totalFare,
    driver_name: order.driver?.name ?? null,
    driver_phone: order.driver?.phone ?? null,
    driver_rating: order.driver?.rating ?? null,
    driver_vehicle: order.driver?.vehicle ?? null,
    driver_plate: order.driver?.plate ?? null,
    driver_lat: order.driver?.coordinate.latitude ?? null,
    driver_lng: order.driver?.coordinate.longitude ?? null,
    proof_of_delivery_note: order.proofOfDeliveryNote ?? null,
    rating: order.rating ?? null,
    rating_comment: order.ratingComment ?? null,
    tip_amount: order.tipAmount ?? 0,
    updated_at: order.updatedAt,
    delivered_at: order.deliveredAt ?? null,
  });
}

export async function syncOrderMessageToSupabase(userId: string, msg: OrderMessage) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('order_messages').upsert({
    id: msg.id,
    order_id: msg.orderId,
    user_id: userId,
    sender_role: msg.senderRole,
    body: msg.body,
    created_at: msg.createdAt,
  });
}
