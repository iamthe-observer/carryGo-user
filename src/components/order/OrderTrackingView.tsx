import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  Bike,
  Car,
  CheckCircle2,
  Copy,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CarryGoMap } from '@/components/map/CarryGoMap';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/services/notifications';
import { formatCurrency, formatDistance } from '@/services/pricing';
import { useCarryGoStore } from '@/store/useCarryGoStore';
import { DeliveryOrder, OrderStatus } from '@/types/delivery';

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'searching', label: 'Order Placed' },
  { status: 'assigned', label: 'Rider Matched' },
  { status: 'arriving_pickup', label: 'At Pickup' },
  { status: 'picked_up', label: 'Picked Up' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'delivered', label: 'Delivered' },
];

const TIP_OPTIONS = [0, 5, 10, 20];

export function OrderTrackingView({ order }: { order: DeliveryOrder }) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const cancelOrder = useCarryGoStore((s) => s.cancelOrder);
  const rateOrder = useCarryGoStore((s) => s.rateOrder);
  const loadReorderDraft = useCarryGoStore((s) => s.loadReorderDraft);
  const showToast = useCarryGoStore((s) => s.showToast);

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(5);
  const [comment, setComment] = useState('');

  const isActive =
    order.status !== 'delivered' && order.status !== 'cancelled';
  const canCancel =
    order.status === 'searching' ||
    order.status === 'assigned' ||
    order.status === 'arriving_pickup';

  const currentStepIdx = TIMELINE_STEPS.findIndex(
    (s) => s.status === order.status
  );

  const handleCopyPin = async () => {
    await Clipboard.setStringAsync(order.deliveryPin);
    triggerHaptic('light');
    showToast({
      title: 'Delivery PIN Copied',
      body: `Share ${order.deliveryPin} with ${order.recipientName}.`,
      tone: 'mint',
    });
  };

  const handleCallDriver = () => {
    if (!order.driver?.phone) return;
    Linking.openURL(`tel:${order.driver.phone.replace(/\s+/g, '')}`).catch(
      () => {}
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Delivery?',
      `Cancel ${order.trackingCode} before pickup?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => cancelOrder(order.id),
        },
      ]
    );
  };

  const handleSubmitRating = () => {
    rateOrder(order.id, stars, comment, tip);
    setRatingModalVisible(false);
    showToast({
      title: 'Thanks for rating!',
      body: `You rated ${order.driver?.name ?? 'your rider'} ${stars}★.`,
      tone: 'mint',
    });
  };

  const handleReorder = () => {
    loadReorderDraft(order);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Hero */}
        <View style={styles.mapContainer}>
          <CarryGoMap
            pickup={order.pickup}
            dropoff={order.dropoff}
            routeCoordinates={order.routeCoordinates}
            driverCoordinate={order.driver?.coordinate}
            driverHeading={order.driver?.heading}
            vehicleTier={order.vehicleTier}
            bottomPadding={40}
          />
          <View
            style={[
              styles.etaFloatingCard,
              Shadows.floating,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View style={styles.etaLeft}>
              <Text style={[styles.trackingCode, { color: palette.inkMuted }]}>
                {order.trackingCode}
              </Text>
              <Text style={[styles.etaHero, { color: palette.ink }]}>
                {order.status === 'delivered'
                  ? 'Delivered'
                  : order.status === 'cancelled'
                    ? 'Cancelled'
                    : order.status === 'searching'
                      ? 'Matching Rider...'
                      : `${order.remainingEtaMinutes} min ETA`}
              </Text>
            </View>
            <StatusBadge status={order.status} />
          </View>
        </View>

        <View style={styles.body}>
          {/* Driver Card */}
          {order.driver ? (
            <View
              style={[
                styles.card,
                Shadows.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <View style={styles.driverRow}>
                <View
                  style={[styles.driverAvatar, { backgroundColor: palette.ink }]}
                >
                  {order.vehicleTier === 'bike' ? (
                    <Bike size={22} color="#FFFFFF" />
                  ) : (
                    <Car size={22} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.driverMeta}>
                  <View style={styles.driverNameRow}>
                    <Text style={[styles.driverName, { color: palette.ink }]}>
                      {order.driver.name}
                    </Text>
                    <View
                      style={[
                        styles.ratingPill,
                        { backgroundColor: palette.amberSoft },
                      ]}
                    >
                      <Star size={12} color={palette.amber} fill={palette.amber} />
                      <Text style={[styles.ratingText, { color: palette.ink }]}>
                        {order.driver.rating.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.driverVehicle, { color: palette.inkSecondary }]}
                  >
                    {order.driver.vehicle} · {order.driver.plate}
                  </Text>
                </View>
              </View>

              {isActive && (
                <View style={styles.driverActions}>
                  <Pressable
                    onPress={() => router.push(`/chat/${order.id}`)}
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor: palette.brandSoft,
                        borderColor: palette.brand,
                      },
                    ]}
                  >
                    <MessageCircle size={16} color={palette.brand} />
                    <Text style={[styles.actionText, { color: palette.brand }]}>
                      Chat with Rider
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCallDriver}
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor: palette.surfaceAlt,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Phone size={16} color={palette.ink} />
                    <Text style={[styles.actionText, { color: palette.ink }]}>
                      Call
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            order.status === 'searching' && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.amberSoft,
                    borderColor: palette.amber,
                  },
                ]}
              >
                <Text style={[styles.searchingTitle, { color: palette.ink }]}>
                  Broadcasting to nearby CarryGo riders...
                </Text>
                <Text
                  style={[styles.searchingSub, { color: palette.inkSecondary }]}
                >
                  A verified {order.vehicleTier === 'bike' ? 'bike' : 'car'}{' '}
                  courier near {order.pickup.label} will accept shortly.
                </Text>
              </View>
            )
          )}

          {/* Delivery PIN Card */}
          {order.status !== 'cancelled' && (
            <Pressable
              onPress={handleCopyPin}
              style={[
                styles.pinCard,
                {
                  backgroundColor: palette.ink,
                },
              ]}
            >
              <View style={styles.pinLeft}>
                <ShieldCheck size={22} color={palette.mint} />
                <View>
                  <Text style={styles.pinLabel}>DELIVERY SECURITY PIN</Text>
                  <Text style={styles.pinHint}>
                    Recipient {order.recipientName} shares this code on arrival
                  </Text>
                </View>
              </View>
              <View style={styles.pinBadge}>
                <Text style={styles.pinDigits}>{order.deliveryPin}</Text>
                <Copy size={14} color="#FF6B35" />
              </View>
            </Pressable>
          )}

          {/* Milestone Timeline */}
          {order.status !== 'cancelled' && (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                Live Delivery Progress
              </Text>
              <View style={styles.timeline}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const done =
                    currentStepIdx >= idx || order.status === 'delivered';
                  const active = currentStepIdx === idx && isActive;
                  const timestamp = order.milestones[step.status];

                  return (
                    <View key={step.status} style={styles.stepRow}>
                      <View style={styles.stepIndicatorCol}>
                        <View
                          style={[
                            styles.stepDot,
                            {
                              backgroundColor: done
                                ? active
                                  ? palette.brand
                                  : palette.mint
                                : palette.border,
                            },
                          ]}
                        />
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              {
                                backgroundColor:
                                  currentStepIdx > idx
                                    ? palette.mint
                                    : palette.border,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.stepCopy}>
                        <Text
                          style={[
                            styles.stepLabel,
                            {
                              color: done ? palette.ink : palette.inkMuted,
                              fontWeight: active ? '800' : '600',
                            },
                          ]}
                        >
                          {step.label}
                        </Text>
                        {timestamp && (
                          <Text
                            style={[
                              styles.stepTime,
                              { color: palette.inkMuted },
                            ]}
                          >
                            {new Date(timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Proof of Delivery & Rating */}
          {order.status === 'delivered' && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.mintSoft,
                  borderColor: palette.mint,
                },
              ]}
            >
              <View style={styles.podHeader}>
                <PackageCheck size={20} color={palette.mint} />
                <Text style={[styles.podTitle, { color: palette.ink }]}>
                  Proof of Delivery Recorded
                </Text>
              </View>
              <Text style={[styles.podNote, { color: palette.inkSecondary }]}>
                {order.proofOfDeliveryNote ||
                  `Delivered to ${order.recipientName} · PIN verified`}
              </Text>

              {order.rating ? (
                <View style={styles.ratedRow}>
                  <CheckCircle2 size={16} color={palette.mint} />
                  <Text style={[styles.ratedText, { color: palette.ink }]}>
                    Rated {order.rating}★
                    {order.tipAmount
                      ? ` · Tipped ${formatCurrency(order.tipAmount)}`
                      : ''}
                  </Text>
                </View>
              ) : (
                <Button
                  title="Rate Rider & Add Tip"
                  variant="primary"
                  size="md"
                  onPress={() => setRatingModalVisible(true)}
                  icon={<Star size={16} color="#FFFFFF" />}
                />
              )}
            </View>
          )}

          {/* Route & Receipt Summary */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              Route & Receipt
            </Text>

            <View style={styles.addressSummary}>
              <Text style={[styles.addrLabel, { color: palette.inkMuted }]}>
                PICKUP
              </Text>
              <Text style={[styles.addrText, { color: palette.ink }]}>
                {order.pickup.addressLine}
              </Text>
              <Text
                style={[
                  styles.addrLabel,
                  { color: palette.inkMuted, marginTop: 8 },
                ]}
              >
                DROP-OFF ({order.recipientName} · {order.recipientPhone})
              </Text>
              <Text style={[styles.addrText, { color: palette.ink }]}>
                {order.dropoff.addressLine}
              </Text>
              <Text
                style={[
                  styles.addrLabel,
                  { color: palette.inkMuted, marginTop: 8 },
                ]}
              >
                PARCEL
              </Text>
              <Text style={[styles.addrText, { color: palette.ink }]}>
                {order.parcelDescription}
                {order.isFragile ? ' · Fragile' : ''}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: palette.border }]} />

            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: palette.inkSecondary }]}>
                Distance ({formatDistance(order.distanceKm)})
              </Text>
              <Text style={[styles.fareVal, { color: palette.ink }]}>
                {formatCurrency(order.baseFare + order.distanceFare)}
              </Text>
            </View>
            {order.handlingFee > 0 && (
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: palette.inkSecondary }]}>
                  Parcel & fragile handling
                </Text>
                <Text style={[styles.fareVal, { color: palette.ink }]}>
                  {formatCurrency(order.handlingFee)}
                </Text>
              </View>
            )}
            {order.discountAmount > 0 && (
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: palette.mint }]}>
                  Promo ({order.promoCode})
                </Text>
                <Text style={[styles.fareVal, { color: palette.mint }]}>
                  -{formatCurrency(order.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.fareTotalRow}>
              <Text style={[styles.totalLabel, { color: palette.ink }]}>
                Paid via {order.paymentMethodLabel}
              </Text>
              <Text style={[styles.totalVal, { color: palette.ink }]}>
                {formatCurrency(order.totalFare)}
              </Text>
            </View>
          </View>

          {canCancel && (
            <Button
              title="Cancel Delivery"
              variant="danger"
              onPress={handleCancel}
              icon={<XCircle size={18} color={palette.danger} />}
            />
          )}

          {!isActive && (
            <Button
              title="Send This Route Again"
              variant="brand"
              onPress={handleReorder}
              icon={<RotateCcw size={18} color="#FFFFFF" />}
            />
          )}
        </View>
      </ScrollView>

      {/* Rating & Tip Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: palette.ink }]}>
              Rate {order.driver?.name ?? 'your CarryGo rider'}
            </Text>
            <Text style={[styles.modalSub, { color: palette.inkSecondary }]}>
              How was the pickup speed and parcel care?
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    triggerHaptic('light');
                    setStars(n);
                  }}
                >
                  <Star
                    size={36}
                    color={n <= stars ? palette.amber : palette.borderStrong}
                    fill={n <= stars ? palette.amber : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.tipLabel, { color: palette.inkSecondary }]}>
              Add a rider tip (from CarryGo Wallet)
            </Text>
            <View style={styles.tipRow}>
              {TIP_OPTIONS.map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setTip(amt)}
                  style={[
                    styles.tipChip,
                    {
                      backgroundColor:
                        tip === amt ? palette.brandSoft : palette.surfaceAlt,
                      borderColor:
                        tip === amt ? palette.brand : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tipChipText,
                      { color: tip === amt ? palette.brand : palette.ink },
                    ]}
                  >
                    {amt === 0 ? 'No tip' : formatCurrency(amt)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Optional feedback..."
              placeholderTextColor={palette.inkMuted}
              style={[
                styles.commentInput,
                {
                  backgroundColor: palette.surfaceAlt,
                  color: palette.ink,
                  borderColor: palette.border,
                },
              ]}
            />

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setRatingModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Rating"
                variant="brand"
                onPress={handleSubmitRating}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  etaFloatingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  etaLeft: {
    gap: 2,
  },
  trackingCode: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  etaHero: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMeta: {
    flex: 1,
    gap: 3,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  driverVehicle: {
    fontSize: 13,
    fontWeight: '500',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  searchingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  searchingSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  pinCard: {
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinLabel: {
    color: '#A3AAB8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pinHint: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  pinDigits: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 34,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 16,
  },
  stepDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: 3,
  },
  stepCopy: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  stepLabel: {
    fontSize: 13.5,
  },
  stepTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  podNote: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  ratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratedText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  addressSummary: {
    gap: 3,
  },
  addrLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  addrText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fareLabel: {
    fontSize: 13.5,
  },
  fareVal: {
    fontSize: 13.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tipChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  commentInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
