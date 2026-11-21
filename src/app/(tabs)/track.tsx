import { useRouter } from 'expo-router';
import { Navigation, PackagePlus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderTrackingView } from '@/components/order/OrderTrackingView';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function TrackTabScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const orders = useCarryGoStore((s) => s.orders);
  const activeOrderId = useCarryGoStore((s) => s.activeOrderId);
  const setActiveOrderId = useCarryGoStore((s) => s.setActiveOrderId);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'delivered' && o.status !== 'cancelled'
      ),
    [orders]
  );

  const selectedOrder = useMemo(() => {
    if (activeOrders.length === 0) return null;
    return (
      activeOrders.find((o) => o.id === activeOrderId) ?? activeOrders[0]
    );
  }, [activeOrders, activeOrderId]);

  if (!selectedOrder) {
    const latestCompleted = orders[0];
    return (
      <SafeAreaView
        style={[styles.emptySafe, { backgroundColor: palette.background }]}
      >
        <View style={styles.emptyWrap}>
          <View
            style={[styles.emptyIcon, { backgroundColor: palette.brandSoft }]}
          >
            <Navigation size={34} color={palette.brand} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            No active deliveries right now
          </Text>
          <Text style={[styles.emptySub, { color: palette.inkSecondary }]}>
            Send a parcel from the Send tab and watch your CarryGo Bike or Car
            courier move live street by street.
          </Text>

          <View style={styles.emptyBtns}>
            <Button
              title="Send a Parcel"
              variant="brand"
              onPress={() => router.replace('/(tabs)')}
              icon={<PackagePlus size={18} color="#FFFFFF" />}
            />
            {latestCompleted && (
              <Button
                title={`View Latest (${latestCompleted.trackingCode})`}
                variant="outline"
                onPress={() => router.push(`/order/${latestCompleted.id}`)}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      {activeOrders.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            styles.switcherBar,
            { backgroundColor: palette.surface, borderBottomColor: palette.border },
          ]}
          contentContainerStyle={styles.switcherContent}
        >
          {activeOrders.map((o) => {
            const active = o.id === selectedOrder.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setActiveOrderId(o.id)}
                style={[
                  styles.switchChip,
                  {
                    backgroundColor: active
                      ? palette.ink
                      : palette.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    { color: active ? palette.inkInverse : palette.ink },
                  ]}
                >
                  {o.trackingCode} · {o.dropoff.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <OrderTrackingView order={selectedOrder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  emptySafe: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 14,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyBtns: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  switcherBar: {
    maxHeight: 54,
    borderBottomWidth: 1,
  },
  switcherContent: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  switchChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  switchText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
