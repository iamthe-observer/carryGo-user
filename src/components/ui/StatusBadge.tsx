import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { OrderStatus } from '@/types/delivery';

const STATUS_LABEL: Record<OrderStatus, string> = {
  searching: 'Finding Rider',
  assigned: 'Rider Assigned',
  arriving_pickup: 'Heading to Pickup',
  picked_up: 'Parcel Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { palette } = useAppTheme();

  let bg = palette.surfaceAlt;
  let fg = palette.inkSecondary;

  if (status === 'searching') {
    bg = palette.amberSoft;
    fg = palette.amber;
  } else if (
    status === 'assigned' ||
    status === 'arriving_pickup' ||
    status === 'picked_up' ||
    status === 'in_transit'
  ) {
    bg = palette.brandSoft;
    fg = palette.brand;
  } else if (status === 'delivered') {
    bg = palette.mintSoft;
    fg = palette.mint;
  } else if (status === 'cancelled') {
    bg = palette.dangerSoft;
    fg = palette.danger;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
