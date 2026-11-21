import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Car,
  Check,
  CreditCard,
  Package,
  Smartphone,
  Tag,
  User,
  Wallet,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import {
  FRAGILE_HANDLING_FEE,
  PARCEL_SIZES,
  VEHICLE_TIERS,
} from '@/constants/config';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fetchRoadRoute } from '@/services/geo';
import { triggerHaptic } from '@/services/notifications';
import {
  calculateFareQuote,
  evaluatePromoCode,
  formatCurrency,
  formatDistance,
} from '@/services/pricing';
import { useCarryGoStore } from '@/store/useCarryGoStore';
import { GeoPoint } from '@/types/delivery';

export default function CheckoutScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  const user = useCarryGoStore((s) => s.user);
  const draft = useCarryGoStore((s) => s.draft);
  const paymentMethods = useCarryGoStore((s) => s.paymentMethods);
  const updateDraft = useCarryGoStore((s) => s.updateDraft);
  const placeOrder = useCarryGoStore((s) => s.placeOrder);
  const resetDraft = useCarryGoStore((s) => s.resetDraft);

  const [promoInput, setPromoInput] = useState(draft.promoCode);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [routeData, setRouteData] = useState<{
    coordinates: GeoPoint[];
    distanceKm: number;
    durationMinutes: number;
    isRoadRoute: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!draft.pickup || !draft.dropoff) return;
      const res = await fetchRoadRoute(draft.pickup, draft.dropoff);
      if (active) setRouteData(res);
    }
    load();
    return () => {
      active = false;
    };
  }, [draft.pickup, draft.dropoff]);

  const quote = useMemo(() => {
    if (!routeData) return null;
    return calculateFareQuote({
      distanceKm: routeData.distanceKm,
      vehicleTier: draft.vehicleTier,
      parcelSize: draft.parcelSize,
      isFragile: draft.isFragile,
      promoCode: draft.promoCode,
      routeCoordinates: routeData.coordinates,
      isRoadRoute: routeData.isRoadRoute,
      osrmDurationMins: routeData.durationMinutes,
    });
  }, [routeData, draft.vehicleTier, draft.parcelSize, draft.isFragile, draft.promoCode]);

  const handleApplyPromo = (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    setPromoInput(code);
    const res = evaluatePromoCode(code, quote ? quote.baseFare + quote.distanceFare + quote.handlingFee : 40);
    if (res.valid) {
      updateDraft({ promoCode: code });
      setPromoFeedback(res.description ?? 'Promo applied!');
      triggerHaptic('success');
    } else {
      updateDraft({ promoCode: '' });
      setPromoFeedback('Invalid code. Try CARRY10, ACCRA5, or FREEDROP.');
      triggerHaptic('warning');
    }
  };

  const handleConfirmBooking = async () => {
    setErrorMsg(null);
    if (!draft.recipientName.trim()) {
      setErrorMsg('Please enter the recipient name.');
      return;
    }
    if (!draft.recipientPhone.trim() || draft.recipientPhone.trim().length < 7) {
      setErrorMsg('Please enter a valid recipient phone number.');
      return;
    }
    if (!quote) {
      setErrorMsg('Still calculating route quote. Please wait a moment.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder(quote);
      resetDraft();
      router.replace(`/order/${order.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const tierCfg = VEHICLE_TIERS[draft.vehicleTier];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: palette.background, borderBottomColor: palette.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <ArrowLeft size={20} color={palette.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.ink }]}>
            Parcel & Checkout
          </Text>
          <Text style={[styles.headerSub, { color: palette.inkSecondary }]}>
            {tierCfg.name} · {quote ? formatDistance(quote.distanceKm) : '...'}
          </Text>
        </View>
        <View style={[styles.tierPill, { backgroundColor: palette.brandSoft }]}>
          {draft.vehicleTier === 'bike' ? (
            <Bike size={16} color={palette.brand} />
          ) : (
            <Car size={16} color={palette.brand} />
          )}
          <Text style={[styles.tierPillText, { color: palette.brand }]}>
            ~{quote?.etaMinutes ?? 18} min
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Route Recap */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              Route Summary
            </Text>
            <Text style={[styles.routeLine, { color: palette.inkSecondary }]}>
              <Text style={{ color: palette.mint, fontWeight: '800' }}>● </Text>
              {draft.pickup?.addressLine}
            </Text>
            <Text style={[styles.routeLine, { color: palette.inkSecondary }]}>
              <Text style={{ color: palette.brand, fontWeight: '800' }}>▼ </Text>
              {draft.dropoff?.addressLine}
            </Text>
          </View>

          {/* Parcel Size Tier */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              Parcel Size & Handling
            </Text>
            <View style={styles.sizeGrid}>
              {PARCEL_SIZES.map((sz) => {
                const selected = draft.parcelSize === sz.id;
                return (
                  <Pressable
                    key={sz.id}
                    onPress={() => {
                      triggerHaptic('light');
                      updateDraft({ parcelSize: sz.id });
                    }}
                    style={[
                      styles.sizeCard,
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
                    <View style={styles.sizeTop}>
                      <Package
                        size={15}
                        color={selected ? palette.brand : palette.ink}
                      />
                      <Text
                        style={[
                          styles.sizeWeight,
                          {
                            color: selected
                              ? palette.brand
                              : palette.inkMuted,
                          },
                        ]}
                      >
                        {sz.maxWeight}
                      </Text>
                    </View>
                    <Text style={[styles.sizeLabel, { color: palette.ink }]}>
                      {sz.label}
                    </Text>
                    <Text
                      style={[styles.sizeSub, { color: palette.inkSecondary }]}
                      numberOfLines={1}
                    >
                      {sz.subtitle}
                    </Text>
                    {sz.surcharge > 0 && (
                      <Text style={[styles.surcharge, { color: palette.brand }]}>
                        +{formatCurrency(sz.surcharge)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={draft.parcelDescription}
              onChangeText={(t) => updateDraft({ parcelDescription: t })}
              placeholder="What are you sending? (e.g. Box of shoes, documents)"
              placeholderTextColor={palette.inkMuted}
              style={[
                styles.input,
                {
                  backgroundColor: palette.surfaceAlt,
                  color: palette.ink,
                  borderColor: palette.border,
                },
              ]}
            />

            <View style={styles.fragileRow}>
              <View style={styles.fragileCopy}>
                <AlertTriangle size={17} color={palette.amber} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fragileTitle, { color: palette.ink }]}>
                    Fragile / Handle with Care (+{formatCurrency(FRAGILE_HANDLING_FEE)})
                  </Text>
                  <Text
                    style={[styles.fragileSub, { color: palette.inkSecondary }]}
                  >
                    Alerts courier to keep parcel upright & cushioned
                  </Text>
                </View>
              </View>
              <Switch
                value={draft.isFragile}
                onValueChange={(v) => updateDraft({ isFragile: v })}
                trackColor={{ false: palette.borderStrong, true: palette.brand }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TextInput
              value={draft.handlingNotes}
              onChangeText={(t) => updateDraft({ handlingNotes: t })}
              placeholder="Pickup / gate note for courier (optional)"
              placeholderTextColor={palette.inkMuted}
              style={[
                styles.input,
                {
                  backgroundColor: palette.surfaceAlt,
                  color: palette.ink,
                  borderColor: palette.border,
                },
              ]}
            />
          </View>

          {/* Recipient Details */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              Recipient Details
            </Text>
            <Text style={[styles.helperText, { color: palette.inkSecondary }]}>
              We generate a 4-digit Delivery PIN so only your recipient can confirm handover.
            </Text>

            <View
              style={[
                styles.iconInput,
                {
                  backgroundColor: palette.surfaceAlt,
                  borderColor: palette.border,
                },
              ]}
            >
              <User size={16} color={palette.inkMuted} />
              <TextInput
                value={draft.recipientName}
                onChangeText={(t) => updateDraft({ recipientName: t })}
                placeholder="Recipient full name"
                placeholderTextColor={palette.inkMuted}
                style={[styles.innerInput, { color: palette.ink }]}
              />
            </View>

            <View
              style={[
                styles.iconInput,
                {
                  backgroundColor: palette.surfaceAlt,
                  borderColor: palette.border,
                },
              ]}
            >
              <Smartphone size={16} color={palette.inkMuted} />
              <TextInput
                value={draft.recipientPhone}
                onChangeText={(t) => updateDraft({ recipientPhone: t })}
                placeholder="+233 24 000 0000"
                placeholderTextColor={palette.inkMuted}
                keyboardType="phone-pad"
                style={[styles.innerInput, { color: palette.ink }]}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              Payment Method
            </Text>
            {paymentMethods.map((pm) => {
              const selected = draft.selectedPaymentMethodId === pm.id;
              return (
                <Pressable
                  key={pm.id}
                  onPress={() => {
                    triggerHaptic('light');
                    updateDraft({ selectedPaymentMethodId: pm.id });
                  }}
                  style={[
                    styles.pmRow,
                    {
                      backgroundColor: selected
                        ? palette.brandSoft
                        : palette.surfaceAlt,
                      borderColor: selected ? palette.brand : palette.border,
                    },
                  ]}
                >
                  {pm.type === 'wallet' ? (
                    <Wallet size={18} color={selected ? palette.brand : palette.ink} />
                  ) : pm.type === 'momo' ? (
                    <Smartphone size={18} color={selected ? palette.brand : palette.ink} />
                  ) : (
                    <CreditCard size={18} color={selected ? palette.brand : palette.ink} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pmLabel, { color: palette.ink }]}>
                      {pm.label}
                    </Text>
                    <Text style={[styles.pmSub, { color: palette.inkSecondary }]}>
                      {pm.type === 'wallet'
                        ? `Balance: ${formatCurrency(user?.walletBalance ?? 0)}`
                        : pm.maskedDetails}
                    </Text>
                  </View>
                  {selected && <Check size={18} color={palette.brand} />}
                </Pressable>
              );
            })}
          </View>

          {/* Promo Code */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              Promo Code
            </Text>
            <View style={styles.promoRow}>
              <View
                style={[
                  styles.iconInput,
                  {
                    flex: 1,
                    backgroundColor: palette.surfaceAlt,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Tag size={15} color={palette.inkMuted} />
                <TextInput
                  value={promoInput}
                  onChangeText={setPromoInput}
                  placeholder="CARRY10 or ACCRA5"
                  placeholderTextColor={palette.inkMuted}
                  autoCapitalize="characters"
                  style={[styles.innerInput, { color: palette.ink }]}
                />
              </View>
              <Pressable
                onPress={() => handleApplyPromo()}
                style={[styles.applyBtn, { backgroundColor: palette.ink }]}
              >
                <Text style={[styles.applyText, { color: palette.inkInverse }]}>
                  Apply
                </Text>
              </Pressable>
            </View>

            <View style={styles.promoChips}>
              {(['CARRY10', 'ACCRA5', 'FREEDROP'] as const).map((code) => (
                <Pressable
                  key={code}
                  onPress={() => handleApplyPromo(code)}
                  style={[
                    styles.promoChip,
                    { backgroundColor: palette.surfaceAlt },
                  ]}
                >
                  <Text style={[styles.promoChipText, { color: palette.brand }]}>
                    {code}
                  </Text>
                </Pressable>
              ))}
            </View>

            {promoFeedback && (
              <Text
                style={[
                  styles.promoFeedback,
                  {
                    color: draft.promoCode ? palette.mint : palette.danger,
                  },
                ]}
              >
                {promoFeedback}
              </Text>
            )}
          </View>

          {/* Fare Breakdown */}
          {quote && (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: palette.ink }]}>
                Fare Breakdown
              </Text>
              <View style={styles.fareLine}>
                <Text style={[styles.fareKey, { color: palette.inkSecondary }]}>
                  Base fare ({tierCfg.name})
                </Text>
                <Text style={[styles.fareVal, { color: palette.ink }]}>
                  {formatCurrency(quote.baseFare)}
                </Text>
              </View>
              <View style={styles.fareLine}>
                <Text style={[styles.fareKey, { color: palette.inkSecondary }]}>
                  Distance ({formatDistance(quote.distanceKm)})
                </Text>
                <Text style={[styles.fareVal, { color: palette.ink }]}>
                  {formatCurrency(quote.distanceFare)}
                </Text>
              </View>
              {quote.handlingFee > 0 && (
                <View style={styles.fareLine}>
                  <Text
                    style={[styles.fareKey, { color: palette.inkSecondary }]}
                  >
                    Size & fragile handling
                  </Text>
                  <Text style={[styles.fareVal, { color: palette.ink }]}>
                    {formatCurrency(quote.handlingFee)}
                  </Text>
                </View>
              )}
              {quote.discountAmount > 0 && (
                <View style={styles.fareLine}>
                  <Text style={[styles.fareKey, { color: palette.mint }]}>
                    Promo discount ({draft.promoCode})
                  </Text>
                  <Text style={[styles.fareVal, { color: palette.mint }]}>
                    -{formatCurrency(quote.discountAmount)}
                  </Text>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: palette.border }]} />
              <View style={styles.fareLine}>
                <Text style={[styles.totalKey, { color: palette.ink }]}>
                  Total Fare
                </Text>
                <Text style={[styles.totalVal, { color: palette.ink }]}>
                  {formatCurrency(quote.totalFare)}
                </Text>
              </View>
            </View>
          )}

          {errorMsg && (
            <View
              style={[styles.errorBox, { backgroundColor: palette.dangerSoft }]}
            >
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {errorMsg}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Checkout Footer */}
      <View
        style={[
          styles.stickyFooter,
          Shadows.floating,
          { backgroundColor: palette.surface, borderTopColor: palette.border },
        ]}
      >
        <Button
          title={
            quote
              ? `Request ${tierCfg.name} · ${formatCurrency(quote.totalFare)}`
              : 'Calculating Fare...'
          }
          variant="brand"
          loading={submitting}
          disabled={!quote}
          onPress={handleConfirmBooking}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12.5,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  tierPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  routeLine: {
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeCard: {
    width: '48.5%',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: 11,
    gap: 3,
  },
  sizeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sizeWeight: {
    fontSize: 11,
    fontWeight: '700',
  },
  sizeLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  sizeSub: {
    fontSize: 11.5,
  },
  surcharge: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
  },
  fragileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fragileCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fragileTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  fragileSub: {
    fontSize: 12,
  },
  helperText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  innerInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
  },
  pmLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pmSub: {
    fontSize: 12,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  promoChips: {
    flexDirection: 'row',
    gap: 8,
  },
  promoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  promoChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  promoFeedback: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  fareLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareKey: {
    fontSize: 13.5,
  },
  fareVal: {
    fontSize: 13.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalKey: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    padding: 12,
    borderRadius: Radius.sm,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
});
