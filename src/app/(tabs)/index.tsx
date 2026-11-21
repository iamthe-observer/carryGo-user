import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ArrowUpDown,
  Bike,
  Car,
  LocateFixed,
  MapPin,
  Navigation,
  Sparkles,
  Wallet,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarryGoMap } from '@/components/map/CarryGoMap';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { ACCRA_QUICK_PLACES, VEHICLE_TIERS } from '@/constants/config';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fetchRoadRoute, getCurrentUserLocation } from '@/services/geo';
import { triggerHaptic } from '@/services/notifications';
import {
  calculateFareQuote,
  formatCurrency,
  formatDistance,
} from '@/services/pricing';
import { useCarryGoStore } from '@/store/useCarryGoStore';
import { GeoPoint } from '@/types/delivery';

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette } = useAppTheme();

  const user = useCarryGoStore((s) => s.user);
  const draft = useCarryGoStore((s) => s.draft);
  const orders = useCarryGoStore((s) => s.orders);
  const savedAddresses = useCarryGoStore((s) => s.savedAddresses);
  const setPickup = useCarryGoStore((s) => s.setPickup);
  const setDropoff = useCarryGoStore((s) => s.setDropoff);
  const swapLocations = useCarryGoStore((s) => s.swapLocations);
  const setVehicleTier = useCarryGoStore((s) => s.setVehicleTier);

  const [locating, setLocating] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routeData, setRouteData] = useState<{
    coordinates: GeoPoint[];
    distanceKm: number;
    durationMinutes: number;
    isRoadRoute: boolean;
  } | null>(null);

  const activeOrder = useMemo(
    () =>
      orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled'),
    [orders]
  );

  // Fetch road route whenever pickup & dropoff change
  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      if (!draft.pickup || !draft.dropoff) {
        setRouteData(null);
        return;
      }
      setRouting(true);
      const res = await fetchRoadRoute(draft.pickup, draft.dropoff);
      if (!cancelled) {
        setRouteData(res);
        setRouting(false);
      }
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    draft.pickup?.latitude,
    draft.pickup?.longitude,
    draft.dropoff?.latitude,
    draft.dropoff?.longitude,
  ]);

  const bikeQuote = useMemo(() => {
    if (!routeData) return null;
    return calculateFareQuote({
      distanceKm: routeData.distanceKm,
      vehicleTier: 'bike',
      parcelSize: draft.parcelSize,
      isFragile: draft.isFragile,
      promoCode: draft.promoCode,
      routeCoordinates: routeData.coordinates,
      isRoadRoute: routeData.isRoadRoute,
      osrmDurationMins: routeData.durationMinutes,
    });
  }, [routeData, draft.parcelSize, draft.isFragile, draft.promoCode]);

  const carQuote = useMemo(() => {
    if (!routeData) return null;
    return calculateFareQuote({
      distanceKm: routeData.distanceKm,
      vehicleTier: 'car',
      parcelSize: draft.parcelSize,
      isFragile: draft.isFragile,
      promoCode: draft.promoCode,
      routeCoordinates: routeData.coordinates,
      isRoadRoute: routeData.isRoadRoute,
      osrmDurationMins: routeData.durationMinutes,
    });
  }, [routeData, draft.parcelSize, draft.isFragile, draft.promoCode]);

  const activeQuote = draft.vehicleTier === 'bike' ? bikeQuote : carQuote;

  const handleUseCurrentGps = async () => {
    setLocating(true);
    triggerHaptic('light');
    const loc = await getCurrentUserLocation();
    if (loc) {
      setPickup(loc);
    }
    setLocating(false);
  };

  const quickDestinations = useMemo(() => {
    const saved = savedAddresses.slice(0, 2).map((a) => ({
      id: a.id,
      label: a.label,
      addressLine: a.addressLine,
      latitude: a.latitude,
      longitude: a.longitude,
    }));
    const places = ACCRA_QUICK_PLACES.slice(0, 4);
    return [...saved, ...places];
  }, [savedAddresses]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <CarryGoMap
        pickup={draft.pickup}
        dropoff={draft.dropoff}
        routeCoordinates={routeData?.coordinates ?? []}
        vehicleTier={draft.vehicleTier}
        bottomPadding={draft.dropoff ? 340 : 280}
      />

      {/* Top Floating Bar */}
      <View
        pointerEvents="box-none"
        style={[styles.topOverlay, { top: Math.max(insets.top + 8, 16) }]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.brandPill,
              Shadows.card,
              { backgroundColor: palette.mapOverlay, borderColor: palette.border },
            ]}
          >
            <BrandLogo size="sm" />
          </View>

          <View style={styles.topRightActions}>
            <Pressable
              onPress={() => router.push('/wallet')}
              style={[
                styles.walletPill,
                Shadows.card,
                { backgroundColor: palette.mapOverlay, borderColor: palette.border },
              ]}
            >
              <Wallet size={15} color={palette.brand} />
              <Text style={[styles.walletText, { color: palette.ink }]}>
                {formatCurrency(user?.walletBalance ?? 0)}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleUseCurrentGps}
              style={[
                styles.gpsBtn,
                Shadows.card,
                { backgroundColor: palette.mapOverlay, borderColor: palette.border },
              ]}
            >
              {locating ? (
                <ActivityIndicator size="small" color={palette.brand} />
              ) : (
                <LocateFixed size={18} color={palette.ink} />
              )}
            </Pressable>
          </View>
        </View>

        {activeOrder && (
          <Pressable
            onPress={() => router.push(`/order/${activeOrder.id}`)}
            style={[
              styles.liveBanner,
              Shadows.floating,
              { backgroundColor: palette.ink },
            ]}
          >
            <View style={[styles.livePulse, { backgroundColor: palette.mint }]} />
            <Text style={[styles.liveTitle, { color: palette.inkInverse }]} numberOfLines={1}>
              Live: {activeOrder.trackingCode} ·{' '}
              {activeOrder.status === 'searching'
                ? 'Matching rider...'
                : `${activeOrder.remainingEtaMinutes} min away`}
            </Text>
            <Navigation size={14} color={palette.brand} />
          </Pressable>
        )}
      </View>

      {/* Bottom Floating Booking Sheet */}
      <View
        style={[
          styles.sheet,
          Shadows.floating,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: palette.ink }]}>
            Where is your parcel going?
          </Text>
          {activeQuote && (
            <View
              style={[styles.distancePill, { backgroundColor: palette.surfaceAlt }]}
            >
              <Text style={[styles.distanceText, { color: palette.inkSecondary }]}>
                {formatDistance(activeQuote.distanceKm)} ·{' '}
                {activeQuote.isRoadRoute ? 'Road route' : 'Est. route'}
              </Text>
            </View>
          )}
        </View>

        {/* Pickup & Dropoff Card */}
        <View
          style={[
            styles.routeBox,
            { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
          ]}
        >
          <View style={styles.routeInputs}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/booking/address-picker',
                  params: { target: 'pickup' },
                })
              }
              style={styles.routeRow}
            >
              <View style={[styles.pickupDot, { backgroundColor: palette.mint }]} />
              <View style={styles.routeTextCol}>
                <Text style={[styles.routeCaption, { color: palette.inkMuted }]}>
                  PICKUP FROM
                </Text>
                <Text
                  style={[styles.routeValue, { color: palette.ink }]}
                  numberOfLines={1}
                >
                  {draft.pickup ? draft.pickup.label : 'Set pickup location'}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.routeDivider, { backgroundColor: palette.border }]} />

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/booking/address-picker',
                  params: { target: 'dropoff' },
                })
              }
              style={styles.routeRow}
            >
              <MapPin size={16} color={palette.brand} />
              <View style={styles.routeTextCol}>
                <Text style={[styles.routeCaption, { color: palette.inkMuted }]}>
                  DELIVER TO
                </Text>
                <Text
                  style={[
                    styles.routeValue,
                    { color: draft.dropoff ? palette.ink : palette.inkMuted },
                  ]}
                  numberOfLines={1}
                >
                  {draft.dropoff
                    ? draft.dropoff.label
                    : 'Enter recipient destination...'}
                </Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              swapLocations();
            }}
            style={[
              styles.swapBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <ArrowUpDown size={16} color={palette.ink} />
          </Pressable>
        </View>

        {/* Quick Suggestions when no dropoff yet */}
        {!draft.dropoff && (
          <View style={styles.quickSection}>
            <View style={styles.quickHeader}>
              <Sparkles size={13} color={palette.brand} />
              <Text style={[styles.quickLabel, { color: palette.inkSecondary }]}>
                Popular Accra drop-offs
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChips}
            >
              {quickDestinations.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => {
                    triggerHaptic('light');
                    setDropoff({
                      label: place.label,
                      addressLine: place.addressLine,
                      latitude: place.latitude,
                      longitude: place.longitude,
                    });
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: palette.surfaceAlt,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <MapPin size={12} color={palette.brand} />
                  <Text style={[styles.chipText, { color: palette.ink }]}>
                    {place.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Vehicle Tier Picker once dropoff is selected */}
        {draft.dropoff && (
          <View style={styles.tierSection}>
            {routing && !activeQuote ? (
              <View style={styles.loadingQuote}>
                <ActivityIndicator color={palette.brand} />
                <Text style={[styles.loadingText, { color: palette.inkSecondary }]}>
                  Calculating Accra road fare...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.tierGrid}>
                  {(['bike', 'car'] as const).map((tierId) => {
                    const cfg = VEHICLE_TIERS[tierId];
                    const q = tierId === 'bike' ? bikeQuote : carQuote;
                    const selected = draft.vehicleTier === tierId;
                    const IconComp = tierId === 'bike' ? Bike : Car;

                    return (
                      <Pressable
                        key={tierId}
                        onPress={() => {
                          triggerHaptic('light');
                          setVehicleTier(tierId);
                        }}
                        style={[
                          styles.tierCard,
                          {
                            backgroundColor: selected
                              ? palette.brandSoft
                              : palette.surfaceAlt,
                            borderColor: selected
                              ? palette.brand
                              : palette.border,
                          },
                        ]}
                      >
                        <View style={styles.tierTop}>
                          <View
                            style={[
                              styles.tierIconWrap,
                              {
                                backgroundColor: selected
                                  ? palette.brand
                                  : palette.surface,
                              },
                            ]}
                          >
                            <IconComp
                              size={18}
                              color={selected ? '#FFFFFF' : palette.ink}
                            />
                          </View>
                          <Text
                            style={[
                              styles.tierEta,
                              {
                                color: selected
                                  ? palette.brand
                                  : palette.inkSecondary,
                              },
                            ]}
                          >
                            ~{q?.etaMinutes ?? 18} min
                          </Text>
                        </View>

                        <Text style={[styles.tierName, { color: palette.ink }]}>
                          {cfg.name}
                        </Text>
                        <Text
                          style={[styles.tierHint, { color: palette.inkSecondary }]}
                          numberOfLines={1}
                        >
                          {tierId === 'bike' ? 'Up to 15 kg' : 'Up to 60 kg · Boot'}
                        </Text>
                        <Text style={[styles.tierPrice, { color: palette.ink }]}>
                          {q ? formatCurrency(q.totalFare) : '—'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Button
                  title={
                    activeQuote
                      ? `Continue · ${formatCurrency(activeQuote.totalFare)}`
                      : 'Continue to Parcel Details'
                  }
                  variant="brand"
                  onPress={() => router.push('/booking/checkout')}
                  icon={<ArrowRight size={18} color="#FFFFFF" />}
                />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  walletText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gpsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    gap: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  distancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  distanceText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  routeInputs: {
    flex: 1,
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  routeTextCol: {
    flex: 1,
  },
  routeCaption: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  routeValue: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  routeDivider: {
    height: 1,
    marginLeft: 26,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSection: {
    gap: 8,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickChips: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  tierSection: {
    gap: 12,
  },
  loadingQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  loadingText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tierCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  tierTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tierIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierEta: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  tierName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  tierHint: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  tierPrice: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
