import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SIMULATED_DRIVERS } from '@/constants/config';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  deleteAddressFromSupabase,
  fetchSupabaseProfile,
  signInWithSupabase,
  signOutSupabase,
  signUpWithSupabase,
  syncAddressToSupabase,
  syncOrderMessageToSupabase,
  syncOrderToSupabase,
  syncPaymentMethodToSupabase,
  syncWalletBalanceToSupabase,
} from '@/services/backend';
import {
  DEMO_PROFILE,
  INITIAL_MESSAGES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_SAMPLE_ORDERS,
  INITIAL_SAVED_ADDRESSES,
} from '@/services/demoData';
import {
  buildInterpolatedFallbackRoute,
  calculateBearing,
  interpolatePointOnRoute,
} from '@/services/geo';
import { triggerHaptic, triggerLocalAlert } from '@/services/notifications';
import {
  formatCurrency,
  generateDeliveryPin,
  generateTrackingCode,
} from '@/services/pricing';
import {
  DeliveryOrder,
  FareQuote,
  GeoPoint,
  LocationSelection,
  OrderMessage,
  OrderStatus,
  ParcelSize,
  PaymentMethod,
  PaymentMethodType,
  SavedAddress,
  UserProfile,
  VehicleTier,
} from '@/types/delivery';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ToastBanner {
  id: string;
  title: string;
  body: string;
  tone: 'brand' | 'mint' | 'amber' | 'danger';
  orderId?: string;
}

interface BookingDraft {
  pickup: LocationSelection | null;
  dropoff: LocationSelection | null;
  vehicleTier: VehicleTier;
  parcelSize: ParcelSize;
  parcelDescription: string;
  isFragile: boolean;
  handlingNotes: string;
  recipientName: string;
  recipientPhone: string;
  promoCode: string;
  selectedPaymentMethodId: string;
}

interface CarryGoState {
  _hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  themePreference: ThemePreference;
  user: UserProfile | null;
  savedAddresses: SavedAddress[];
  paymentMethods: PaymentMethod[];
  orders: DeliveryOrder[];
  messagesByOrder: Record<string, OrderMessage[]>;
  activeOrderId: string | null;
  draft: BookingDraft;
  toast: ToastBanner | null;

  // Actions
  setHasHydrated: (hydrated: boolean) => void;
  setHasCompletedOnboarding: (done: boolean) => void;
  setThemePreference: (pref: ThemePreference) => void;
  dismissToast: () => void;
  showToast: (toast: Omit<ToastBanner, 'id'>) => void;

  // Auth
  loginDemo: () => void;
  loginSupabase: (email: string, password: string) => Promise<void>;
  signupSupabase: (params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  hydrateSupabaseSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Draft & Booking
  setPickup: (loc: LocationSelection | null) => void;
  setDropoff: (loc: LocationSelection | null) => void;
  swapLocations: () => void;
  setVehicleTier: (tier: VehicleTier) => void;
  updateDraft: (patch: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  loadReorderDraft: (order: DeliveryOrder) => void;

  // Orders
  placeOrder: (quote: FareQuote) => Promise<DeliveryOrder>;
  cancelOrder: (orderId: string) => void;
  rateOrder: (orderId: string, rating: number, comment: string, tipAmount: number) => void;
  setActiveOrderId: (orderId: string | null) => void;
  resumeActiveSimulations: () => void;

  // Chat
  sendOrderMessage: (orderId: string, body: string) => void;

  // Wallet & Account CRUD
  topUpWallet: (amount: number, sourceLabel: string) => void;
  addSavedAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  removeSavedAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addPaymentMethod: (params: {
    type: PaymentMethodType;
    provider: string;
    label: string;
    maskedDetails: string;
  }) => void;
  setDefaultPaymentMethod: (id: string) => void;
  removePaymentMethod: (id: string) => void;
}

const activeTimers = new Map<string, ReturnType<typeof setInterval>>();

function createUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_DRAFT: BookingDraft = {
  pickup: {
    label: 'Cantonments (Home)',
    addressLine: '14 Cantonments Crescent, Cantonments, Accra',
    latitude: 5.5742,
    longitude: -0.1731,
  },
  dropoff: null,
  vehicleTier: 'bike',
  parcelSize: 'small_box',
  parcelDescription: '',
  isFragile: false,
  handlingNotes: '',
  recipientName: '',
  recipientPhone: '',
  promoCode: '',
  selectedPaymentMethodId: 'pm-momo-mtn',
};

function clearOrderTimer(orderId: string) {
  const existing = activeTimers.get(orderId);
  if (existing) {
    clearInterval(existing);
    activeTimers.delete(orderId);
  }
}

function getSmartDriverReply(userText: string, order: DeliveryOrder): string {
  const lower = userText.toLowerCase();
  if (lower.includes('where') || lower.includes('far') || lower.includes('eta')) {
    if (order.status === 'arriving_pickup' || order.status === 'assigned') {
      return `I am heading to ${order.pickup.label} now — should reach pickup in about 2 minutes.`;
    }
    if (order.status === 'in_transit' || order.status === 'picked_up') {
      return `I am on the road to ${order.dropoff.label}, about ${order.remainingKm.toFixed(1)} km away (${order.remainingEtaMinutes} mins left).`;
    }
  }
  if (lower.includes('call') || lower.includes('gate') || lower.includes('wait')) {
    return `Got it! I will call ${order.recipientName || 'you'} as soon as I pull up.`;
  }
  if (lower.includes('fragile') || lower.includes('careful')) {
    return `No worries, your parcel is secured safely inside my ${order.vehicleTier === 'bike' ? 'padded top-box' : 'boot'}.`;
  }
  if (lower.includes('pin')) {
    return `Noted! I will verify the recipient's PIN (${order.deliveryPin}) before handing it over.`;
  }
  return `Received with thanks! Everything is moving smoothly with ${order.trackingCode}.`;
}

export const useCarryGoStore = create<CarryGoState>()(
  persist(
    (set, get) => {
      const startOrderSimulation = (orderId: string) => {
        clearOrderTimer(orderId);

        let tick = 0;
        const interval = setInterval(() => {
          const state = get();
          const order = state.orders.find((o) => o.id === orderId);
          if (!order || order.status === 'delivered' || order.status === 'cancelled') {
            clearOrderTimer(orderId);
            return;
          }

          tick += 1;
          const nowIso = new Date().toISOString();
          const userId = state.user?.id;

          const updateOrder = (
            patch: Partial<DeliveryOrder>,
            newStatus?: OrderStatus,
            notify?: { title: string; body: string; tone: ToastBanner['tone']; systemMsg?: string }
          ) => {
            set((prev) => ({
              orders: prev.orders.map((o) => {
                if (o.id !== orderId) return o;
                const milestones = { ...o.milestones };
                if (newStatus && !milestones[newStatus]) {
                  milestones[newStatus] = nowIso;
                }
                return {
                  ...o,
                  ...patch,
                  status: newStatus ?? o.status,
                  updatedAt: nowIso,
                  milestones,
                };
              }),
            }));

            const updated = get().orders.find((o) => o.id === orderId);
            if (updated && userId && !state.user?.isDemo) {
              syncOrderToSupabase(userId, updated).catch(() => {});
            }

            if (notify) {
              get().showToast({
                title: notify.title,
                body: notify.body,
                tone: notify.tone,
                orderId,
              });
              triggerLocalAlert(notify.title, notify.body);
              if (notify.tone === 'mint') {
                triggerHaptic('success');
              } else {
                triggerHaptic('light');
              }

              if (notify.systemMsg) {
                const sysMsg: OrderMessage = {
                  id: createUuid(),
                  orderId,
                  senderRole: 'system',
                  body: notify.systemMsg,
                  createdAt: nowIso,
                };
                set((prev) => ({
                  messagesByOrder: {
                    ...prev.messagesByOrder,
                    [orderId]: [...(prev.messagesByOrder[orderId] ?? []), sysMsg],
                  },
                }));
              }
            }
          };

          // Timeline ticks (1 tick = 1.2s):
          // tick 3 (~3.6s): assigned
          // tick 5 (~6s): arriving_pickup + interpolate from nearby to pickup
          // tick 9 (~10.8s): picked_up
          // tick 10 (~12s): in_transit along full routeCoordinates
          // tick 24 (~28.8s): delivered

          if (order.status === 'searching' && tick >= 3) {
            const pickedDriver =
              SIMULATED_DRIVERS[Math.floor(Math.random() * SIMULATED_DRIVERS.length)];
            const startCoord: GeoPoint = {
              latitude: order.pickup.latitude + 0.0055,
              longitude: order.pickup.longitude - 0.0045,
            };
            const vehicle =
              order.vehicleTier === 'bike'
                ? pickedDriver.bikeVehicle
                : pickedDriver.carVehicle;
            const plate =
              order.vehicleTier === 'bike'
                ? pickedDriver.bikePlate
                : pickedDriver.carPlate;

            updateOrder(
              {
                driver: {
                  name: pickedDriver.name,
                  phone: pickedDriver.phone,
                  rating: pickedDriver.rating,
                  vehicle,
                  plate,
                  coordinate: startCoord,
                  heading: calculateBearing(startCoord, order.pickup),
                },
              },
              'assigned',
              {
                title: `Rider Assigned · ${pickedDriver.name}`,
                body: `${vehicle} (${plate}) is heading to pickup.`,
                tone: 'brand',
                systemMsg: `${pickedDriver.name} accepted your CarryGo delivery (${plate}).`,
              }
            );
            return;
          }

          if (order.status === 'assigned' && tick >= 5) {
            updateOrder({}, 'arriving_pickup', {
              title: 'Courier En Route to Pickup',
              body: `${order.driver?.name ?? 'Your rider'} is 2 mins away from ${order.pickup.label}.`,
              tone: 'brand',
            });
            return;
          }

          if (order.status === 'arriving_pickup') {
            const approachProgress = Math.min(1, (tick - 5) / 4);
            const startPt: GeoPoint = {
              latitude: order.pickup.latitude + 0.0055,
              longitude: order.pickup.longitude - 0.0045,
            };
            const approachRoute = buildInterpolatedFallbackRoute(
              startPt,
              order.pickup,
              8
            );
            const { coordinate, heading } = interpolatePointOnRoute(
              approachRoute,
              approachProgress
            );

            if (tick >= 9) {
              updateOrder(
                {
                  driver: order.driver
                    ? { ...order.driver, coordinate: order.pickup, heading }
                    : undefined,
                },
                'picked_up',
                {
                  title: 'Parcel Picked Up!',
                  body: `${order.driver?.name ?? 'Rider'} collected your parcel. Now heading to ${order.dropoff.label}.`,
                  tone: 'mint',
                  systemMsg: `Parcel collected from ${order.pickup.label}. En route to ${order.dropoff.label}.`,
                }
              );
            } else if (order.driver) {
              updateOrder({
                driver: { ...order.driver, coordinate, heading },
              });
            }
            return;
          }

          if (order.status === 'picked_up' && tick >= 10) {
            updateOrder({}, 'in_transit');
            return;
          }

          if (order.status === 'in_transit') {
            const transitSteps = 14;
            const progress = Math.min(1, (tick - 10) / transitSteps);
            const { coordinate, heading } = interpolatePointOnRoute(
              order.routeCoordinates,
              progress
            );
            const remainingKm = Math.max(
              0,
              Math.round(order.distanceKm * (1 - progress) * 10) / 10
            );
            const remainingEtaMinutes = Math.max(
              1,
              Math.ceil(order.etaMinutes * (1 - progress))
            );

            if (progress >= 1) {
              const deliveredIso = new Date().toISOString();
              updateOrder(
                {
                  remainingKm: 0,
                  remainingEtaMinutes: 0,
                  deliveredAt: deliveredIso,
                  proofOfDeliveryNote: `Delivered to ${order.recipientName} · PIN ${order.deliveryPin} verified`,
                  driver: order.driver
                    ? { ...order.driver, coordinate: order.dropoff, heading }
                    : undefined,
                },
                'delivered',
                {
                  title: 'Parcel Delivered!',
                  body: `${order.trackingCode} handed to ${order.recipientName}. PIN ${order.deliveryPin} verified.`,
                  tone: 'mint',
                  systemMsg: `Delivery completed at ${order.dropoff.label}. Proof of Delivery recorded.`,
                }
              );
              clearOrderTimer(orderId);
            } else if (order.driver) {
              updateOrder({
                remainingKm,
                remainingEtaMinutes,
                driver: { ...order.driver, coordinate, heading },
              });
            }
          }
        }, 1200);

        activeTimers.set(orderId, interval);
      };

      return {
        _hasHydrated: false,
        hasCompletedOnboarding: false,
        themePreference: 'system',
        user: null,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        paymentMethods: INITIAL_PAYMENT_METHODS,
        orders: INITIAL_SAMPLE_ORDERS,
        messagesByOrder: INITIAL_MESSAGES,
        activeOrderId: null,
        draft: DEFAULT_DRAFT,
        toast: null,

        setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
        setHasCompletedOnboarding: (done) => set({ hasCompletedOnboarding: done }),
        setThemePreference: (pref) => set({ themePreference: pref }),
        dismissToast: () => set({ toast: null }),
        showToast: (toast) => {
          const id = createUuid();
          set({ toast: { ...toast, id } });
          setTimeout(() => {
            if (get().toast?.id === id) {
              set({ toast: null });
            }
          }, 4200);
        },

        loginDemo: () => {
          triggerHaptic('success');
          set({
            user: DEMO_PROFILE,
            hasCompletedOnboarding: true,
          });
        },

        loginSupabase: async (email, password) => {
          const data = await signInWithSupabase(email, password);
          if (data.user) {
            const profile = await fetchSupabaseProfile(data.user.id);
            set({
              user: profile ?? {
                id: data.user.id,
                email: data.user.email ?? email,
                fullName: data.user.user_metadata?.full_name ?? 'CarryGo Sender',
                phone: data.user.user_metadata?.phone ?? '',
                walletBalance: 120,
                isDemo: false,
              },
              hasCompletedOnboarding: true,
            });
            triggerHaptic('success');
          }
        },

        signupSupabase: async ({ email, password, fullName, phone }) => {
          const data = await signUpWithSupabase({
            email,
            password,
            fullName,
            phone,
          });
          if (data.user) {
            set({
              user: {
                id: data.user.id,
                email,
                fullName,
                phone,
                walletBalance: 120,
                isDemo: false,
              },
              hasCompletedOnboarding: true,
            });
            triggerHaptic('success');
          }
        },

        hydrateSupabaseSession: async () => {
          if (!isSupabaseConfigured || !supabase) return;
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const profile = await fetchSupabaseProfile(data.session.user.id);
            if (profile) {
              set({ user: profile });
            }
          }
        },

        logout: async () => {
          activeTimers.forEach((_, id) => clearOrderTimer(id));
          await signOutSupabase().catch(() => {});
          set({ user: null, activeOrderId: null });
        },

        setPickup: (loc) =>
          set((state) => ({ draft: { ...state.draft, pickup: loc } })),

        setDropoff: (loc) =>
          set((state) => ({ draft: { ...state.draft, dropoff: loc } })),

        swapLocations: () =>
          set((state) => ({
            draft: {
              ...state.draft,
              pickup: state.draft.dropoff,
              dropoff: state.draft.pickup,
            },
          })),

        setVehicleTier: (tier) =>
          set((state) => ({ draft: { ...state.draft, vehicleTier: tier } })),

        updateDraft: (patch) =>
          set((state) => ({ draft: { ...state.draft, ...patch } })),

        resetDraft: () =>
          set((state) => ({
            draft: {
              ...DEFAULT_DRAFT,
              pickup: state.draft.pickup ?? DEFAULT_DRAFT.pickup,
              selectedPaymentMethodId:
                state.paymentMethods.find((p) => p.isDefault)?.id ??
                DEFAULT_DRAFT.selectedPaymentMethodId,
            },
          })),

        loadReorderDraft: (order) =>
          set((state) => ({
            draft: {
              ...state.draft,
              pickup: order.pickup,
              dropoff: order.dropoff,
              vehicleTier: order.vehicleTier,
              parcelSize: order.parcelSize,
              parcelDescription: order.parcelDescription,
              isFragile: order.isFragile,
              handlingNotes: order.handlingNotes,
              recipientName: order.recipientName,
              recipientPhone: order.recipientPhone,
              promoCode: '',
              selectedPaymentMethodId: order.paymentMethodId,
            },
          })),

        placeOrder: async (quote) => {
          const state = get();
          const { draft, paymentMethods, user } = state;
          if (!draft.pickup || !draft.dropoff) {
            throw new Error('Pickup and drop-off locations are required.');
          }

          const payment =
            paymentMethods.find((p) => p.id === draft.selectedPaymentMethodId) ??
            paymentMethods[0];

          // Deduct wallet if paying by CarryGo Wallet
          if (payment.type === 'wallet' && user) {
            if (user.walletBalance < quote.totalFare) {
              throw new Error(
                `Insufficient CarryGo Wallet balance (${formatCurrency(user.walletBalance)}). Please top up or select another method.`
              );
            }
            const nextBalance = Math.round((user.walletBalance - quote.totalFare) * 100) / 100;
            set({ user: { ...user, walletBalance: nextBalance } });
            if (!user.isDemo) {
              syncWalletBalanceToSupabase(user.id, nextBalance).catch(() => {});
            }
          }

          const nowIso = new Date().toISOString();
          const orderId = createUuid();
          const newOrder: DeliveryOrder = {
            id: orderId,
            trackingCode: generateTrackingCode(),
            status: 'searching',
            vehicleTier: draft.vehicleTier,
            pickup: draft.pickup,
            dropoff: draft.dropoff,
            distanceKm: quote.distanceKm,
            etaMinutes: quote.etaMinutes,
            remainingKm: quote.distanceKm,
            remainingEtaMinutes: quote.etaMinutes,
            routeCoordinates: quote.routeCoordinates,
            parcelSize: draft.parcelSize,
            parcelDescription:
              draft.parcelDescription.trim() || 'Standard CarryGo Parcel',
            isFragile: draft.isFragile,
            handlingNotes: draft.handlingNotes.trim(),
            recipientName: draft.recipientName.trim() || 'Recipient',
            recipientPhone: draft.recipientPhone.trim() || '+233 24 000 0000',
            deliveryPin: generateDeliveryPin(),
            paymentMethodId: payment.id,
            paymentMethodLabel: payment.label,
            promoCode: draft.promoCode.trim().toUpperCase() || undefined,
            baseFare: quote.baseFare,
            distanceFare: quote.distanceFare,
            handlingFee: quote.handlingFee,
            discountAmount: quote.discountAmount,
            totalFare: quote.totalFare,
            createdAt: nowIso,
            updatedAt: nowIso,
            milestones: {
              searching: nowIso,
            },
          };

          const welcomeMsg: OrderMessage = {
            id: createUuid(),
            orderId,
            senderRole: 'system',
            body: `Order ${newOrder.trackingCode} placed. Searching for nearest CarryGo ${
              newOrder.vehicleTier === 'bike' ? 'Bike' : 'Car'
            } courier...`,
            createdAt: nowIso,
          };

          set((prev) => ({
            orders: [newOrder, ...prev.orders],
            activeOrderId: orderId,
            messagesByOrder: {
              ...prev.messagesByOrder,
              [orderId]: [welcomeMsg],
            },
          }));

          if (user && !user.isDemo) {
            syncOrderToSupabase(user.id, newOrder).catch(() => {});
            syncOrderMessageToSupabase(user.id, welcomeMsg).catch(() => {});
          }

          triggerHaptic('success');
          startOrderSimulation(orderId);
          return newOrder;
        },

        cancelOrder: (orderId) => {
          clearOrderTimer(orderId);
          const nowIso = new Date().toISOString();
          set((prev) => ({
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'cancelled',
                    updatedAt: nowIso,
                    milestones: { ...o.milestones, cancelled: nowIso },
                  }
                : o
            ),
            activeOrderId: prev.activeOrderId === orderId ? null : prev.activeOrderId,
          }));
          const state = get();
          const cancelled = state.orders.find((o) => o.id === orderId);
          if (cancelled && state.user && !state.user.isDemo) {
            syncOrderToSupabase(state.user.id, cancelled).catch(() => {});
          }
          triggerHaptic('warning');
        },

        rateOrder: (orderId, rating, comment, tipAmount) => {
          const state = get();
          if (tipAmount > 0 && state.user) {
            const nextBal = Math.max(
              0,
              Math.round((state.user.walletBalance - tipAmount) * 100) / 100
            );
            set({ user: { ...state.user, walletBalance: nextBal } });
          }
          set((prev) => ({
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    rating,
                    ratingComment: comment.trim(),
                    tipAmount,
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
          const updated = get().orders.find((o) => o.id === orderId);
          if (updated && state.user && !state.user.isDemo) {
            syncOrderToSupabase(state.user.id, updated).catch(() => {});
          }
          triggerHaptic('success');
        },

        setActiveOrderId: (orderId) => set({ activeOrderId: orderId }),

        resumeActiveSimulations: () => {
          const orders = get().orders;
          for (const order of orders) {
            if (
              order.status !== 'delivered' &&
              order.status !== 'cancelled' &&
              !activeTimers.has(order.id)
            ) {
              startOrderSimulation(order.id);
            }
          }
        },

        sendOrderMessage: (orderId, body) => {
          const trimmed = body.trim();
          if (!trimmed) return;
          const nowIso = new Date().toISOString();
          const userMsg: OrderMessage = {
            id: createUuid(),
            orderId,
            senderRole: 'user',
            body: trimmed,
            createdAt: nowIso,
          };

          set((prev) => ({
            messagesByOrder: {
              ...prev.messagesByOrder,
              [orderId]: [...(prev.messagesByOrder[orderId] ?? []), userMsg],
            },
          }));

          const state = get();
          if (state.user && !state.user.isDemo) {
            syncOrderMessageToSupabase(state.user.id, userMsg).catch(() => {});
          }

          // Smart simulated driver reply
          const order = state.orders.find((o) => o.id === orderId);
          if (order && order.driver && order.status !== 'cancelled') {
            setTimeout(() => {
              const reply: OrderMessage = {
                id: createUuid(),
                orderId,
                senderRole: 'driver',
                body: getSmartDriverReply(trimmed, order),
                createdAt: new Date().toISOString(),
              };
              set((prev) => ({
                messagesByOrder: {
                  ...prev.messagesByOrder,
                  [orderId]: [...(prev.messagesByOrder[orderId] ?? []), reply],
                },
              }));
              triggerHaptic('light');
            }, 1100);
          }
        },

        topUpWallet: (amount, sourceLabel) => {
          const user = get().user;
          if (!user || amount <= 0) return;
          const nextBalance = Math.round((user.walletBalance + amount) * 100) / 100;
          set({ user: { ...user, walletBalance: nextBalance } });
          if (!user.isDemo) {
            syncWalletBalanceToSupabase(user.id, nextBalance).catch(() => {});
          }
          get().showToast({
            title: 'Wallet Topped Up',
            body: `${formatCurrency(amount)} added via ${sourceLabel}.`,
            tone: 'mint',
          });
          triggerHaptic('success');
        },

        addSavedAddress: (addr) => {
          const id = createUuid();
          const user = get().user;
          set((prev) => {
            const list = addr.isDefault
              ? prev.savedAddresses.map((a) => ({ ...a, isDefault: false }))
              : prev.savedAddresses;
            return { savedAddresses: [{ ...addr, id }, ...list] };
          });
          if (user && !user.isDemo) {
            syncAddressToSupabase(user.id, { ...addr, id }).catch(() => {});
          }
        },

        removeSavedAddress: (id) => {
          const user = get().user;
          set((prev) => ({
            savedAddresses: prev.savedAddresses.filter((a) => a.id !== id),
          }));
          if (user && !user.isDemo) {
            deleteAddressFromSupabase(id).catch(() => {});
          }
        },

        setDefaultAddress: (id) => {
          set((prev) => ({
            savedAddresses: prev.savedAddresses.map((a) => ({
              ...a,
              isDefault: a.id === id,
            })),
          }));
        },

        addPaymentMethod: (params) => {
          const id = createUuid();
          const user = get().user;
          const newMethod: PaymentMethod = {
            id,
            type: params.type,
            provider: params.provider,
            label: params.label,
            maskedDetails: params.maskedDetails,
            isDefault: false,
          };
          set((prev) => ({
            paymentMethods: [...prev.paymentMethods, newMethod],
          }));
          if (user && !user.isDemo) {
            syncPaymentMethodToSupabase(user.id, newMethod).catch(() => {});
          }
        },

        setDefaultPaymentMethod: (id) => {
          set((prev) => ({
            paymentMethods: prev.paymentMethods.map((p) => ({
              ...p,
              isDefault: p.id === id,
            })),
            draft: { ...prev.draft, selectedPaymentMethodId: id },
          }));
        },

        removePaymentMethod: (id) => {
          set((prev) => ({
            paymentMethods: prev.paymentMethods.filter((p) => p.id !== id),
          }));
        },
      };
    },
    {
      name: 'carrygo-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        themePreference: state.themePreference,
        user: state.user,
        savedAddresses: state.savedAddresses,
        paymentMethods: state.paymentMethods,
        orders: state.orders,
        messagesByOrder: state.messagesByOrder,
        activeOrderId: state.activeOrderId,
      }),
    }
  )
);
