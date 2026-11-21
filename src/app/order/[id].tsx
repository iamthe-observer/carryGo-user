import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderTrackingView } from '@/components/order/OrderTrackingView';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useAppTheme();

  const order = useCarryGoStore((s) => s.orders.find((o) => o.id === id));

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: palette.surface, borderBottomColor: palette.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
          ]}
        >
          <ArrowLeft size={19} color={palette.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.ink }]}>
            {order ? order.trackingCode : 'Delivery Order'}
          </Text>
          <Text style={[styles.sub, { color: palette.inkSecondary }]}>
            {order ? `${order.pickup.label} → ${order.dropoff.label}` : ''}
          </Text>
        </View>
      </View>

      {order ? (
        <OrderTrackingView order={order} />
      ) : (
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: palette.inkSecondary }]}>
            Order not found.
          </Text>
        </View>
      )}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12.5,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
